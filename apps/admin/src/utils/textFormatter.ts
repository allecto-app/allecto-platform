export const roleFormatter = (role: string) => {
  switch (role) {
    case "resident":
      return "Morador";
    case "syndic":
      return "Síndico";
    case "manager":
      return "Gestor";
    case "council":
      return "Conselheiro";
    case "owner":
      return "Propietário";
    case "tenant":
      return "Inquilino";
  }
};

export const notificationFormatter = (role: string) => {
  switch (role) {
    case "convocation":
      return "Convocação";
    case "reminderD2":
      return "Lembrete D2";
    case "reminderD4":
      return "Lembrete D4";
    case "closed":
      return "Fechamento";
  }
};
