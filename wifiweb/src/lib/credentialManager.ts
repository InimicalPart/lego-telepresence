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
import bcrypt from "bcrypt";
import { readFileSync } from "fs";
import UserPrivileges from './privileges';

const users: {
    username: string,
    password: string,
    privileges: number
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

export async function verifyJWT(jwt: string, hostname: string) {

    try {
        const { payload } = await jose.jwtVerify(jwt, secret, {
            issuer: 'inimi:wifiweb:'+hostname,
            audience: 'inimi:wifiweb:'+hostname,
            algorithms: ['HS256']
        })
        

        return verifyCreds({
            username: payload.username as string,
            password: Buffer.from(payload.password as string, "base64").toString("utf-8")
        });
    } catch (e) {
        return false;
    }

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

    return await verifyPassword(creds.password, user.password);
}


export const getPrivileges = (user: string) => {
    const u = users.find(u => u.username === user);
    if (!u) return null
    return new UserPrivileges(u.privileges);
}