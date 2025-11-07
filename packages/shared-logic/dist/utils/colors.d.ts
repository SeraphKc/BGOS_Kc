export declare const COLORS: {
    readonly MAIN_BG: "rgb(38, 38, 36)";
    readonly SIDEBAR_BG: "rgb(31, 30, 28)";
    readonly CARD_BG: "#2A2A2A";
    readonly INPUT_BG: "rgb(48, 48, 46)";
    readonly BORDER: "#3A3A3A";
    readonly WHITE_1: "#FFFFFF";
    readonly WHITE_4: "#FFFFFF";
    readonly PRIMARY_1: "#FFD900";
    readonly DARK_1: "rgb(38, 38, 36)";
    readonly DARK_2: "#2A2A2A";
    readonly DARK_3: "rgb(48, 48, 46)";
    readonly DARK_BG: "rgb(38, 38, 36)";
    readonly ERROR: "#FF1F1F";
};
export declare const WHITE_4_OPACITIES: {
    readonly 10: "rgba(255, 255, 255, 0.1)";
    readonly 20: "rgba(255, 255, 255, 0.2)";
    readonly 30: "rgba(255, 255, 255, 0.3)";
    readonly 40: "rgba(255, 255, 255, 0.4)";
    readonly 50: "rgba(255, 255, 255, 0.5)";
    readonly 60: "rgba(255, 255, 255, 0.6)";
    readonly 70: "rgba(255, 255, 255, 0.7)";
    readonly 80: "rgba(255, 255, 255, 0.8)";
    readonly 90: "rgba(255, 255, 255, 0.9)";
};
export declare const SEMANTIC_COLORS: {
    readonly background: {
        readonly primary: "rgb(38, 38, 36)";
        readonly secondary: "#2A2A2A";
        readonly tertiary: "rgb(48, 48, 46)";
        readonly card: "rgb(38, 38, 36)";
    };
    readonly text: {
        readonly primary: "#FFFFFF";
        readonly secondary: "rgba(255, 255, 255, 0.7)";
        readonly muted: "rgba(255, 255, 255, 0.5)";
        readonly disabled: "rgba(255, 255, 255, 0.3)";
    };
    readonly interactive: {
        readonly primary: "#FFD900";
        readonly error: "#FF1F1F";
        readonly success: "#4CAF50";
        readonly warning: "#FF9800";
    };
    readonly border: {
        readonly primary: "rgba(255, 255, 255, 0.1)";
        readonly secondary: "rgba(255, 255, 255, 0.2)";
        readonly focus: "#FFD900";
        readonly error: "#FF1F1F";
    };
};
export type ColorName = keyof typeof COLORS;
export type White4Opacity = keyof typeof WHITE_4_OPACITIES;
export type SemanticColorPath = keyof typeof SEMANTIC_COLORS;
export declare const getColorWithOpacity: (color: string, opacity: number) => string;
export declare const getSemanticColor: (path: string) => string;
