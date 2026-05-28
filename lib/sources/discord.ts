const API = "https://discord.com/api/v10";

type DiscordMessage = {
  id: string;
  timestamp: string;
  mentions: { id: string }[];
  author: { username: string };
};

async function dget<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bot ${token}` },
  });
  if (res.status === 429) {
    const retry = Number(res.headers.get("retry-after") ?? "1");
    await new Promise((r) => setTimeout(r, retry * 1000));
    return dget<T>(path, token);
  }
  if (!res.ok) throw new Error(`Discord ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export async function discordPingsByHour(opts: {
  token?: string;
  guildId?: string;
  selfId?: string; // bot/user id; if set, count only pings that mention this id
}): Promise<Record<number, number>> {
  const token = opts.token ?? process.env.DISCORD_BOT_TOKEN;
  const guildId = opts.guildId ?? process.env.DISCORD_GUILD_ID;
  if (!token || !guildId) throw new Error("DISCORD_BOT_TOKEN and DISCORD_GUILD_ID required");

  const channels = await dget<{ id: string; type: number }[]>(
    `/guilds/${guildId}/channels`,
    token
  );
  const textChannels = channels.filter((c) => c.type === 0); // 0 = GUILD_TEXT

  const today = new Date().toISOString().slice(0, 10);
  const byHour: Record<number, number> = {};

  for (const ch of textChannels) {
    const msgs = await dget<DiscordMessage[]>(
      `/channels/${ch.id}/messages?limit=100`,
      token
    );
    for (const m of msgs) {
      if (!m.timestamp.startsWith(today)) continue;
      const isPing = opts.selfId
        ? m.mentions?.some((u) => u.id === opts.selfId)
        : (m.mentions?.length ?? 0) > 0;
      if (!isPing) continue;
      const hour = new Date(m.timestamp).getHours();
      byHour[hour] = (byHour[hour] ?? 0) + 1;
    }
  }
  return byHour;
}
