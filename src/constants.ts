export enum UserGroup {
  Reporter = 'reporter',
  Manager = 'manager',
  Administrator = 'administrator',
}

export const SETTING_KEYS = [
  'pointsPerWin',
  'pointsPerLose',
  'pointsPerDraw',
  'winRate',
  'loseRate',
  'drawRate',
  'playsOnFirstLogin',
  'playsPerDay',
];

export enum TimeEnum {
  ONE_HOUR = 3600,
}

export const USER_ACCESS_TOKEN_PREFIX = 'game_nngg:access_token';
