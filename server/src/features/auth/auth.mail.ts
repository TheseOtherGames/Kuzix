import nodemailer from 'nodemailer';
import { config } from '../../core/config';

export const mailEnabled = Boolean(config.smtp.host);

const transport = mailEnabled
	? nodemailer.createTransport({
		host: config.smtp.host,
		port: config.smtp.port,
		// 465 is TLS from the start; other ports upgrade with STARTTLS.
		secure: config.smtp.port === 465,
		auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.password } : undefined,
	})
	: null;

const CONFIRM_TEXT = {
	en: {
		subject: 'Confirm your Kuzix email',
		preheader: 'One click to confirm your email and start playing.',
		title: 'Confirm your email',
		intro: 'Welcome to Kuzix! Press the button below to confirm your email and activate your account.',
		button: 'Confirm my email',
		expiry: 'The link works for 24 hours.',
		fallback: 'Button not working? Copy this link into your browser:',
		ignore: 'You received this email because someone signed up on Kuzix with this address. If it was not you, ignore it: the account will not be activated.',
		tagline: 'a game by TheseOtherGames',
	},
	fr: {
		subject: 'Confirmez votre e-mail Kuzix',
		preheader: 'Un clic pour confirmer votre e-mail et commencer à jouer.',
		title: 'Confirmez votre e-mail',
		intro: 'Bienvenue sur Kuzix ! Appuyez sur le bouton ci-dessous pour confirmer votre e-mail et activer votre compte.',
		button: 'Confirmer mon e-mail',
		expiry: 'Le lien est valable 24 heures.',
		fallback: 'Le bouton ne marche pas ? Copiez ce lien dans votre navigateur :',
		ignore: 'Vous recevez cet e-mail car quelqu\'un s\'est inscrit sur Kuzix avec cette adresse. Si ce n\'est pas vous, ignorez-le : le compte ne sera pas activé.',
		tagline: 'un jeu de TheseOtherGames',
	},
};

type ConfirmText = typeof CONFIRM_TEXT.en;

const escapeHtml = (value: string): string => value
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;');

// Brand values from the brand kit (BrandView): answer colours for the wordmark and strip, dark navy band, cream page.
const LOGO_COLORS = [
	'#ff3d71',
	'#3d8bff',
	'#ffb800',
	'#1fc96f',
	'#9b5cff',
];
const STRIP_COLORS = [...LOGO_COLORS, '#ff7a2f'];
const FONT = '\'Fredoka\', \'Trebuchet MS\', \'Segoe UI\', Arial, sans-serif';

// Kept deliverable on purpose: tables + inline styles only (what every client renders), no images, scripts,
// forms or external CSS/fonts, a plain-text twin with the same words, every link on our own site and
// the raw link shown too. Outlook drops the rounded corners; the layout still holds.
const confirmationHtml = (text: ConfirmText, link: string, lang: string): string => {
	const href = escapeHtml(link);
	const site = escapeHtml(config.frontUrl);
	const wordmark = [...'Kuzix'].map((letter, index) => `<span style="color:${LOGO_COLORS[index]};">${letter}</span>`).join('');
	const strip = STRIP_COLORS.map((color) => `<td height="6" style="height:6px;line-height:6px;font-size:0;background:${color};">&nbsp;</td>`).join('');

	return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(text.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#fff7ec;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(text.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff7ec;">
<tr><td align="center" style="padding:32px 16px;">
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:20px;border:2px solid #f1e4d0;border-bottom:6px solid #e9d6bb;">
	<tr><td style="background:#10151f;border-radius:18px 18px 0 0;padding:26px 24px 22px;text-align:center;font-family:${FONT};font-size:38px;line-height:44px;font-weight:700;letter-spacing:1px;">${wordmark}</td></tr>
	<tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${strip}</tr></table></td></tr>
	<tr><td style="padding:36px 36px 8px;font-family:${FONT};color:#1e2230;">
		<h1 style="margin:0 0 14px;font-size:26px;line-height:32px;font-weight:700;color:#1e2230;">${escapeHtml(text.title)}</h1>
		<p style="margin:0 0 28px;font-size:16px;line-height:24px;color:#3a3f4d;">${escapeHtml(text.intro)}</p>
		<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>
			<td align="center" style="background:#8a45f5;border-radius:999px;border-bottom:4px solid #5b24b8;">
				<a href="${href}" style="display:inline-block;padding:15px 34px;font-family:${FONT};font-size:18px;line-height:22px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">${escapeHtml(text.button)}</a>
			</td>
		</tr></table>
		<p style="margin:22px 0 0;font-size:14px;line-height:20px;color:#565b69;text-align:center;">${escapeHtml(text.expiry)}</p>
	</td></tr>
	<tr><td style="padding:24px 36px 32px;font-family:${FONT};">
		<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#f7eedf;border-radius:12px;padding:14px 16px;">
			<p style="margin:0 0 6px;font-size:13px;line-height:18px;color:#565b69;">${escapeHtml(text.fallback)}</p>
			<p style="margin:0;font-size:13px;line-height:18px;word-break:break-all;"><a href="${href}" style="color:#5b24b8;text-decoration:underline;">${href}</a></p>
		</td></tr></table>
	</td></tr>
	</table>
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
	<tr><td style="padding:20px 24px 0;font-family:${FONT};font-size:12px;line-height:18px;color:#565b69;text-align:center;">
		<p style="margin:0 0 8px;">${escapeHtml(text.ignore)}</p>
		<p style="margin:0;"><a href="${site}" style="color:#565b69;text-decoration:underline;">Kuzix</a> · ${escapeHtml(text.tagline)}</p>
	</td></tr>
	</table>
</td></tr>
</table>
</body>
</html>`;
};

const confirmationText = (text: ConfirmText, link: string): string => {
	return `${text.title}\n\n${text.intro}\n\n${link}\n\n${text.expiry}\n\n--\n${text.ignore}\nKuzix · ${text.tagline} · ${config.frontUrl}\n`;
};

export const sendConfirmationEmail = async (to: string, link: string, locale: unknown): Promise<void> => {
	const lang = locale === 'fr' ? 'fr' : 'en';
	const text = CONFIRM_TEXT[lang];
	await transport!.sendMail({
		// A bare address gets the Kuzix display name; `Name <address>` in SMTP_FROM is kept as is.
		from: config.smtp.from.includes('<') ? config.smtp.from : { name: 'Kuzix', address: config.smtp.from },
		to,
		subject: text.subject,
		text: confirmationText(text, link),
		html: confirmationHtml(text, link, lang),
	});
};
