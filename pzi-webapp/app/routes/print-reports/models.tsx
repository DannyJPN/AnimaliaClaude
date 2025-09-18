export enum PrintReportType {
    Specimen = "Exemplaře",
    Species = "Druhy",
    Zoology = "Zoologie",
    Economy = "Ekonomika",
    Mzpr = "MŽPR",
    Correspondence = "Korespondence",
    Empty = "",
};

export enum InZooFilterMode {
    None = "nostate",
    Reg = "reg",
    EuFauna = "eufauna",
    CrOchrana = "crprotection",
    NoEuPermit = "noeupermit",
    NoEuPermitRegOnly = "noeupermitregonly",
    DecisionEuFauna = "decisioneu",
    DecisionCrException = "decisioncr",
};

export enum StateInfluenceMode {
    WithInfluence = "withinfluence",
    WithoutInfluence = "withoutinfluence",
};

export type PrintReport = {
    id: number;
    name: string;
    description: string;
    link: string;
    type: PrintReportType;
  };