export async function sendEmail(_to: string, _subject: string, _html: string) {
  // TODO: wire up SMTP or a provider like SendGrid
  return { ok: true };
}

export async function sendPush(_token: string, _title: string, _body: string) {
  // TODO: wire up FCM/OneSignal
  return { ok: true };
}


