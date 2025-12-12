# CalculEat - Setup Guide för Production

Detta dokument beskriver steg-för-steg hur du konfigurerar CalculEat för production med custom email-domän och förbättrad säkerhet.

---

## 1. Konfigurera Email-Domän (calculeat.com)

### Steg 1.1: Välj Email-Leverantör

Du behöver välja en av följande email-leverantörer:

#### Option A: SendGrid (Rekommenderat)

- **Fördelar:** Etablerad tjänst, bra leveransbarhet, gratis tier
- **Pris:** Gratis för 100 emails/dag
- **Setup:** https://sendgrid.com/

#### Option B: Amazon SES

- **Fördelar:** Mycket billigt, skalbart
- **Pris:** $0.10 per 1,000 emails
- **Setup:** https://aws.amazon.com/ses/

#### Option C: Postmark

- **Fördelar:** Hög leveransbarhet, bra support
- **Pris:** $15/månad för 10,000 emails
- **Setup:** https://postmarkapp.com/

### Steg 1.2: Konfigurera DNS Records

För att skicka email från `noreply@calculeat.com`, lägg till följande DNS records (exempel från SendGrid):

```dns
# SPF Record
TXT @ "v=spf1 include:sendgrid.net ~all"

# DKIM Records (får du från email-leverantören)
CNAME s1._domainkey.calculeat.com -> s1.domainkey.u12345.wl.sendgrid.net
CNAME s2._domainkey.calculeat.com -> s2.domainkey.u12345.wl.sendgrid.net

# DMARC Record
TXT _dmarc.calculeat.com "v=DMARC1; p=none; rua=mailto:postmaster@calculeat.com"
```

### Steg 1.3: Konfigurera Supabase SMTP

1. Gå till [Supabase Dashboard → Authentication → Email Provider](https://supabase.com/dashboard/project/_/auth/providers)
2. Aktivera "Enable Custom SMTP"
3. Fyll i SMTP-inställningar från din email-leverantör:

**För SendGrid:**

```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: <your-sendgrid-api-key>
Sender Email: noreply@calculeat.com
Sender Name: CalculEat
```

**För Amazon SES:**

```
SMTP Host: email-smtp.eu-west-1.amazonaws.com (byt region om nödvändigt)
SMTP Port: 587
SMTP User: <your-ses-smtp-username>
SMTP Password: <your-ses-smtp-password>
Sender Email: noreply@calculeat.com
Sender Name: CalculEat
```

4. Klicka "Save"
5. Testa genom att skicka ett test-email

---

## 2. Anpassa Email-Templates

Gå till [Supabase Dashboard → Authentication → Email Templates](https://supabase.com/dashboard/project/_/auth/templates)

### 2.1 Confirm Signup Template

**Subject:** `Bekräfta din registrering på CalculEat`

**Body:**

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bekräfta din registrering</title>
  </head>
  <body
    style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;"
  >
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="background-color: #f3f4f6; padding: 40px 0;"
    >
      <tr>
        <td align="center">
          <table
            width="600"
            cellpadding="0"
            cellspacing="0"
            style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
          >
            <!-- Header -->
            <tr>
              <td
                style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;"
              >
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                  CalculEat
                </h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 40px;">
                <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">
                  Välkommen till CalculEat!
                </h2>

                <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                  Tack för att du registrerat dig hos CalculEat. För att komma igång behöver du
                  bekräfta din e-postadress genom att klicka på knappen nedan.
                </p>

                <!-- Button -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding: 20px 0;">
                      <a
                        href="{{ .ConfirmationURL }}"
                        style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;"
                      >
                        Bekräfta min e-postadress
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                  Om knappen inte fungerar, kopiera och klistra in följande länk i din webbläsare:
                </p>
                <p
                  style="margin: 10px 0 0 0; color: #667eea; font-size: 14px; word-break: break-all;"
                >
                  {{ .ConfirmationURL }}
                </p>

                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />

                <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                  Om du inte registrerade dig på CalculEat kan du ignorera detta email.
                  <br /><br />
                  Länken är giltig i 24 timmar.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #f9fafb; padding: 30px; text-align: center;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                  © 2025 CalculEat. Alla rättigheter förbehållna.
                  <br />
                  <a href="{{ .SiteURL }}" style="color: #667eea; text-decoration: none;"
                    >calculeat.com</a
                  >
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

### 2.2 Reset Password Template

**Subject:** `Återställ ditt lösenord - CalculEat`

**Body:**

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Återställ ditt lösenord</title>
  </head>
  <body
    style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;"
  >
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="background-color: #f3f4f6; padding: 40px 0;"
    >
      <tr>
        <td align="center">
          <table
            width="600"
            cellpadding="0"
            cellspacing="0"
            style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
          >
            <!-- Header -->
            <tr>
              <td
                style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;"
              >
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                  CalculEat
                </h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 40px;">
                <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">
                  Återställ ditt lösenord
                </h2>

                <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                  Vi fick en begäran om att återställa lösenordet för ditt CalculEat-konto. Klicka
                  på knappen nedan för att välja ett nytt lösenord.
                </p>

                <!-- Button -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding: 20px 0;">
                      <a
                        href="{{ .ConfirmationURL }}"
                        style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;"
                      >
                        Återställ mitt lösenord
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                  Om knappen inte fungerar, kopiera och klistra in följande länk i din webbläsare:
                </p>
                <p
                  style="margin: 10px 0 0 0; color: #667eea; font-size: 14px; word-break: break-all;"
                >
                  {{ .ConfirmationURL }}
                </p>

                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />

                <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                  Om du inte begärde en lösenordsåterställning kan du ignorera detta email.
                  <br /><br />
                  Länken är giltig i 1 timme av säkerhetsskäl.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #f9fafb; padding: 30px; text-align: center;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                  © 2025 CalculEat. Alla rättigheter förbehållna.
                  <br />
                  <a href="{{ .SiteURL }}" style="color: #667eea; text-decoration: none;"
                    >calculeat.com</a
                  >
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

### 2.3 Magic Link Template

**Subject:** `Din inloggningslänk - CalculEat`

**Body:**

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Din inloggningslänk</title>
  </head>
  <body
    style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;"
  >
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="background-color: #f3f4f6; padding: 40px 0;"
    >
      <tr>
        <td align="center">
          <table
            width="600"
            cellpadding="0"
            cellspacing="0"
            style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
          >
            <!-- Header -->
            <tr>
              <td
                style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;"
              >
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                  CalculEat
                </h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 40px;">
                <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">
                  Logga in på CalculEat
                </h2>

                <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                  Klicka på knappen nedan för att logga in på ditt CalculEat-konto.
                </p>

                <!-- Button -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding: 20px 0;">
                      <a
                        href="{{ .ConfirmationURL }}"
                        style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;"
                      >
                        Logga in
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                  Om knappen inte fungerar, kopiera och klistra in följande länk i din webbläsare:
                </p>
                <p
                  style="margin: 10px 0 0 0; color: #667eea; font-size: 14px; word-break: break-all;"
                >
                  {{ .ConfirmationURL }}
                </p>

                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />

                <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                  Om du inte försökte logga in kan du ignorera detta email.
                  <br /><br />
                  Länken är giltig i 1 timme.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #f9fafb; padding: 30px; text-align: center;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                  © 2025 CalculEat. Alla rättigheter förbehållna.
                  <br />
                  <a href="{{ .SiteURL }}" style="color: #667eea; text-decoration: none;"
                    >calculeat.com</a
                  >
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

---

## 3. Implementera "Resend Email" Funktionalitet

Denna funktionalitet är redan förberedd för implementation. Instruktioner finns i [RESEND-EMAIL-IMPLEMENTATION.md](./RESEND-EMAIL-IMPLEMENTATION.md).

---

## 4. Lägg till Password Strength Meter

Instruktioner finns i [PASSWORD-STRENGTH-METER.md](./PASSWORD-STRENGTH-METER.md).

---

## 5. Säkerhet - Rate Limiting

### Konfigurera i Supabase Dashboard:

1. Gå till [Authentication → Rate Limits](https://supabase.com/dashboard/project/_/auth/rate-limits)
2. Konfigurera följande:
   - **Email OTP:** 360 per hour (default är bra)
   - **SMS OTP:** 360 per hour
   - **Email Link:** 360 per hour
   - **Password Reset:** 60 seconds mellan requests
   - **Signup:** 60 seconds mellan requests

---

## 6. Aktivera CAPTCHA (Google reCAPTCHA)

### Steg 6.1: Skaffa reCAPTCHA Keys

1. Gå till https://www.google.com/recaptcha/admin
2. Registrera en ny site
3. Välj reCAPTCHA v2 "I'm not a robot" checkbox
4. Lägg till din domän: `calculeat.com` och `localhost` (för development)
5. Kopiera **Site Key** och **Secret Key**

### Steg 6.2: Konfigurera i Supabase

1. Gå till [Supabase Dashboard → Authentication → Settings](https://supabase.com/dashboard/project/_/auth/providers)
2. Scrolla ner till "Security and Protection"
3. Aktivera "Enable CAPTCHA protection"
4. Fyll i:
   - **CAPTCHA Provider:** Google reCAPTCHA
   - **Site Key:** <din-site-key>
   - **Secret Key:** <din-secret-key>
5. Aktivera CAPTCHA för:
   - ✅ Sign up
   - ✅ Sign in
   - ✅ Password recovery

---

## 7. Next Steps

Efter att du har konfigurerat ovanstående:

1. ✅ Testa email-flöden igen med `calculeat.com` domän
2. ✅ Verifiera att templates ser korrekta ut
3. ✅ Testa CAPTCHA-funktionalitet
4. ✅ Implementera övriga nice-to-have features

---

## Troubleshooting

### Emails kommer inte fram

- Kontrollera DNS records är korrekt konfigurerade
- Vänta 24-48 timmar för DNS-propagering
- Kontrollera spam-folder
- Använd email deliverability test tools (mail-tester.com)

### SMTP errors

- Verifiera SMTP credentials är korrekta
- Kontrollera att API-nycklar inte har upphört
- Kontrollera SendGrid/SES sending limits

### CAPTCHA fungerar inte

- Verifiera att domänen är tillagd i reCAPTCHA admin
- Kontrollera att Site Key är korrekt i frontend
- Kontrollera att Secret Key är korrekt i Supabase

---

**Skapad:** 2025-12-09
**Version:** 1.0
