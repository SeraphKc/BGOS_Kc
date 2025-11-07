import { MD3DarkTheme } from 'react-native-paper';
import { COLORS } from '@bgos/shared-logic';

export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: COLORS.PRIMARY_1,
    background: COLORS.MAIN_BG,
    surface: COLORS.CARD_BG,
    error: COLORS.ERROR,
  },
};
