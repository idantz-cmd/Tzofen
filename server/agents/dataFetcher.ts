export class DataFetcherAgent {
  static async getMatchData(_homeTeam: string, _awayTeam: string): Promise<string> {
    throw new Error("Data fetcher not configured");
  }

  static async getLatestNews(): Promise<string> {
    throw new Error("Data fetcher not configured");
  }

  static async getTeamInfo(_teamName: string): Promise<string> {
    throw new Error("Data fetcher not configured");
  }

  static async getMatchPredictionData(
    _homeTeam: string,
    _awayTeam: string,
    _league: string
  ): Promise<string> {
    throw new Error("Data fetcher not configured");
  }

  static async getLeagueStandings(_league: string): Promise<string> {
    throw new Error("Data fetcher not configured");
  }

  static async getPlayerInfo(_playerName: string): Promise<string> {
    throw new Error("Data fetcher not configured");
  }

  static async getTransferNews(): Promise<string> {
    throw new Error("Data fetcher not configured");
  }

  static async getInjuryUpdates(): Promise<string> {
    throw new Error("Data fetcher not configured");
  }

  static async getHeadToHead(_team1: string, _team2: string): Promise<string> {
    throw new Error("Data fetcher not configured");
  }
}
