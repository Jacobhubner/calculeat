# Mejlmallar (Supabase Auth)

Mallarna i den här mappen är **källan** för de transaktionsmejl Supabase Auth
skickar. De ligger här i repot för att de ska gå att granska och versionshantera
— Supabase har inget API för att deploya dem, så de måste klistras in manuellt.

## Så uppdaterar du en mall

1. Öppna **Supabase Dashboard → Authentication → Emails → Templates**
2. Välj mallen (se tabellen nedan)
3. Klistra in hela innehållet från motsvarande `.html`-fil
4. Sätt ämnesraden enligt tabellen
5. Spara och skicka ett testmejl

| Fil                     | Supabase-mall        | Ämnesrad                                  |
| ----------------------- | -------------------- | ----------------------------------------- |
| `confirm-signup.html`   | Confirm signup       | Bekräfta din e-postadress — Calculeat     |
| `reset-password.html`   | Reset password       | Återställ ditt lösenord — Calculeat       |
| `magic-link.html`       | Magic link           | Din inloggningslänk — Calculeat           |
| `change-email.html`     | Change email address | Bekräfta din nya e-postadress — Calculeat |
| `invite-user.html`      | Invite user          | Du är inbjuden till Calculeat             |
| `reauthentication.html` | Reauthentication     | Din verifieringskod — Calculeat           |

## Designval

**Loggan laddas som PNG från `https://calculeat.com/calculeat-logo-512.png`.**
Mejlklienter renderar inte SVG, och relativa URL:er fungerar inte i mejl — därför
absolut URL mot produktionsdomänen. Byter du filnamn i `public/` måste mallarna
uppdateras.

**Tabellbaserad layout med inline-CSS.** Outlook använder Words renderingsmotor
och stödjer varken flexbox, grid eller `<style>`-block tillförlitligt. Layouten är
därför nästlade tabeller med attribut, vilket ser föråldrat ut men är det som
faktiskt fungerar överallt.

**Bakgrundsgradienten på knappen** är loggans egen (grön → gul → orange). Outlook
ignorerar `background-image` och faller tillbaka på `background-color`, som är satt
till orange — därför ser knappen enfärgad ut där, vilket är avsiktligt.

**Varje mall innehåller länken som klartext** under knappen. Vissa klienter och
företagsfilter tar bort knappar eller bryter länkar; klartextvarianten är
räddningen och är dessutom ett tillgänglighetskrav.

## Kvarstående: avsändarnamnet

Mejlen kommer i dag från **"Supabase Auth"**, vilket ser oseriöst ut i inkorgen.
Det ändras under **Project Settings → Authentication → SMTP Settings** och kräver
egen SMTP-leverantör (Resend, Postmark, SendGrid).

Notera också att Supabases inbyggda mejlutskick har en hård gräns på ca 3–4 mejl
per timme — den är avsedd för utveckling, inte produktion. Egen SMTP behövs alltså
oavsett avsändarnamnet.
