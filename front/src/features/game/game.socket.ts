import type { ClientMessage, ServerMessage } from '@/features/game/game.types';
import { t } from '@/shared/i18n/i18n';
import { toast } from '@/shared/toast.store';

const RECONNECT_DELAY_MS = 2000;

// Reconnects automatically and re-sends the greeting so the server restores the session.
export class GameSocket {
	private ws: WebSocket | null = null;
	private closedByUser = false;
	private wasConnected = false;
	private suspended = false;

	constructor(
		private greeting: () => ClientMessage,
		private onMessage: (message: ServerMessage) => void,
	) {
		addEventListener('pagehide', this.onPageHide);
		addEventListener('pageshow', this.onPageShow);
		this.connect();
	}

	send(message: ClientMessage): void {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(message));
		}
	}

	close(): void {
		this.closedByUser = true;
		removeEventListener('pagehide', this.onPageHide);
		removeEventListener('pageshow', this.onPageShow);
		this.ws?.close();
	}

	// The back/forward cache keeps a left page alive with its socket open, so the server would think
	// we're still here (e.g. a host who left never showed as disconnected). Close on leave, reconnect on Back.
	private onPageHide = (): void => {
		this.suspended = true;
		this.ws?.close();
	};

	private onPageShow = (event: PageTransitionEvent): void => {
		if (event.persisted && this.suspended && !this.closedByUser) {
			this.suspended = false;
			this.connect();
		}
	};

	private connect(): void {
		const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
		this.ws = new WebSocket(`${protocol}://${location.host}/ws`);
		this.ws.addEventListener('open', () => {
			if (this.wasConnected) {
				toast.success(t('common.reconnected'));
			}
			this.wasConnected = true;
			this.send(this.greeting());
		});
		this.ws.addEventListener('message', (event) => {
			this.onMessage(JSON.parse(event.data));
		});
		this.ws.addEventListener('close', () => {
			if (this.closedByUser || this.suspended) {
				return;
			}
			if (this.wasConnected) {
				toast.error(t('common.reconnecting'));
			}
			setTimeout(() => this.connect(), RECONNECT_DELAY_MS);
		});
	}
}
