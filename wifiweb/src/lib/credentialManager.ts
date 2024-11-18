/*
 * Copyright (c) 2024 Inimi | InimicalPart
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import * as jose from 'jose'
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import UserPrivileges from './privileges';
import { writeFile } from 'fs/promises';
import * as uuid from 'uuid';


const users: {
    uuid: string,
    username: string,
    password: string,
    privileges: number,
    createdAt: string
    createdBy: string
}[] = JSON.parse(readFileSync("users.json", {encoding: "utf-8"}).toString());

const secret = new TextEncoder().encode(
    process.env.JWT_SECRET ?? "496e696d69497354686542657374436f646572416c6976654e6f446f756274"
)

export async function JWTFromCreds(creds: { username: string, password: string, hostname: string }) {
    return await new jose.SignJWT({
        username: creds.username,
        password: Buffer.from(creds.password).toString("base64")
    })
    .setProtectedHeader({
        alg: 'HS256'
    })
    .setIssuedAt()
    .setNotBefore(new Date())
    .setIssuer('inimi:wifiweb:'+creds.hostname)
    .setAudience('inimi:wifiweb:'+creds.hostname)
    .setExpirationTime('2h')
    .sign(secret);
}

export async function getUsernameFromJWT(jwt: string | null, hostname:string) {

    if (!jwt) return null;

    const { payload } = await jose.jwtVerify(jwt, secret, {
        issuer: 'inimi:wifiweb:'+hostname,
        audience: 'inimi:wifiweb:'+hostname,
        algorithms: ['HS256']
    })

    return payload.username as string;
}

export async function getUserPassHash(user: string) {
    const u = users.find(u => u.username === user);
    if (!u) return null;
    return u.password;
}

export async function verifyJWT(jwt: string, hostname: string) {

    try {
        const { payload } = await jose.jwtVerify(jwt, secret, {
            issuer: 'inimi:wifiweb:'+hostname,
            audience: 'inimi:wifiweb:'+hostname,
            algorithms: ['HS256']
        })
        
        return await verifyCreds({
            username: payload.username as string,
            password: Buffer.from(payload.password as string, "base64").toString("utf-8")
        });
    } catch {
        return false;
    }

}

export async function changeUserPassword(user: string, newPass: string) {
    const u = users.find(u => u.username === user);
    if (!u) return false;

    u.password = await hashPassword(newPass);

    await saveUsersDB();

    return true;
}

export async function saveUsersDB() {
    return await writeFile("users.json", JSON.stringify(users, null, 2), {encoding: "utf-8"});
}

export async function reloadUsersDB() {
    const data = JSON.parse(readFileSync("users.json", {encoding: "utf-8"}).toString());
    users.splice(0, users.length, ...data);
}

export async function hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
}

export async function verifyCreds(creds: { username: string, password: string }) {
    const user = users.find(u => u.username === creds.username);
    if (!user) return false;

    const valid = await verifyPassword(creds.password, user.password)

    return valid ? creds : false;
}

export async function isDefaultPassword(hash: string) {
    //! Yes I know I obfuscated this for absolutely no reason, but it's fun and I'm proud of it. !\\
    return await bcrypt.compare(Buffer.from(Buffer.from(Uint8Array.from([7.6,7.7,12,10.7,12.7,12,10.9,11.9,13.2,13.2,7.5,12.6].map((_,__)=>(_*10)-__-15))).toString("utf-8").split('').reverse().join(''), "base64").toString("utf-8"), hash);
}

export function getUsers<T>(mapFunction: (user: { username: string, privileges: number, password: string, uuid: string, createdAt: string, createdBy:string }) => T = (u) => u as unknown as T) {
    return users.map(mapFunction);
}


export const getPrivileges = (user: string) => {
    const u = users.find(u => u.username === user);
    if (!u) return null
    return new UserPrivileges(u.privileges);
}

export async function getUserByUUID(uuid: string) {
    return users.find(u => u.uuid === uuid) ?? null;
}

export async function getUUIDbyUser(username: string) {
    return users.find(u => u.username === username)?.uuid ?? null;
}

export async function generatePassword(length: number = 16) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$&";
    let pass = "";
    for (let i = 0; i < length; i++) {
        pass += chars[Math.floor(Math.random() * chars.length)];
    }
    return pass;
}
export async function createUser(username: string, password: string, privileges: number, createdBy: string) {
    const user = {
        uuid: await generateUUID(),
        username,
        password: await hashPassword(password),
        createdAt: new Date().toISOString(),
        createdBy,
        privileges
    }
    users.push(user);
    await saveUsersDB();
    return user;
}

export async function deleteUserByUUID(uuid: string) {
    const index = users.findIndex(u => u.uuid === uuid);
    if (index === -1) return false;
    users.splice(index, 1);
    await saveUsersDB();
    return true;
}

export async function deleteUserByUsername(username: string) {
    const index = users.findIndex(u => u.username === username);
    if (index === -1) return false;
    users.splice(index, 1);
    await saveUsersDB();
    return true;
}

export async function UUIDTaken(uuid: string) {
    return users.some(u => u.uuid === uuid);
}

export async function generateUUID() {
    let UUID = uuid.v4();
    while (await UUIDTaken(UUID)) {
        UUID = uuid.v4(); 
    }
    return UUID;
}