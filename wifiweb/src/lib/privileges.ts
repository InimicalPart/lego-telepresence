export enum Privileges {
    ROOT            = 1 << 0, // 1
    MANAGE_USERS    = 1 << 1, // 2
    MANAGE_NETWORKS = 1 << 2, // 4
}

export default class UserPrivileges {
    private privileges = 0



    constructor(privileges: number) {
        this.privileges = privileges
    }

    public toMask() {
        return this.privileges
    }

    static toMask(privs: string[]) {
        let out = 0
        for (const priv of privs) {
            out |= Privileges[priv as keyof typeof Privileges]
        }
        return out
    }

    public hasPrivileges(check: number) {
        return (this.privileges & check) === check || (this.privileges & Privileges.ROOT) === Privileges.ROOT
    }

    public addPrivileges(add: number) {
        this.privileges |= add
    }

    public removePrivileges(remove: number) {
        this.privileges &= ~remove
    }

}