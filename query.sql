create table if not exists users (
    id integer primary key autoincrement,
    login text not null unique,
    password text not null,
    createdAt timestamp default current_timestamp
);

create table if not exists contacts (
    id integer primary key autoincrement,
    lastName string not null,
    firstName string not null,
    middleName string not null,
    group string not null,
    phone string not null,
    email string not null,
    address string not null,
    fullName string not null,
    createdAt timestamp default current_timestamp,
    userId integer not null,

    foreign key(userId) references users(id)
);
