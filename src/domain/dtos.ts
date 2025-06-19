export type RegistrationDto = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
};

export type RegistrationResultDto = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
};

export type UserResultDto = RegistrationResultDto;

export type UserDto = UserResultDto;