export class Room {
	private readonly fullname: string;
	private readonly shortname: string;
	private readonly number: string;
	private readonly name: string;
	private readonly address: string;
	private readonly lat: number;
	private readonly lon: number;
	private readonly seats: number;
	private readonly type: string;
	private readonly furniture: string;
	private readonly href: string;

	constructor(
		fullname: string,
		shortname: string,
		number: string,
		name: string,
		address: string,
		lat: number,
		lon: number,
		seats: number,
		type: string,
		furniture: string,
		href: string
	) {
		this.fullname = fullname;
		this.shortname = shortname;
		this.number = number;
		this.name = name;
		this.address = address;
		this.lat = lat;
		this.lon = lon;
		this.seats = seats;
		this.type = type;
		this.furniture = furniture;
		this.href = href;
	}

	public getFullname(): string {
		return this.fullname;
	}

	public getShortname(): string {
		return this.shortname;
	}

	public getNumber(): string {
		return this.number;
	}

	public getName(): string {
		return this.name;
	}

	public getAddress(): string {
		return this.address;
	}

	public getLat(): number {
		return this.lat;
	}

	public getLon(): number {
		return this.lon;
	}

	public getSeats(): number {
		return this.seats;
	}

	public getType(): string {
		return this.type;
	}

	public getFurniture(): string {
		return this.furniture;
	}

	public getHref(): string {
		return this.href;
	}

	public toJSON(): any {
		return {
			fullname: this.fullname,
			shortname: this.shortname,
			number: this.number,
			name: this.name,
			address: this.address,
			lat: this.lat,
			lon: this.lon,
			seats: this.seats,
			type: this.type,
			furniture: this.furniture,
			href: this.href,
		};
	}
}
