export interface IGenre {
  id: string;
  name: string;
  description?: string;
  slug: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateGenre {
  name: string;
  description?: string;
}

export interface IUpdateGenre {
  name?: string;
  description?: string;
}