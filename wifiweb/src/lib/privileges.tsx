export enum Privileges {
    ROOT            = 1 << 0, // 1
    MANAGE_USERS    = 1 << 1, // 2
    MANAGE_NETWORKS = 1 << 2, // 4
}

export enum PrivilegePresets {
    ALL = Object.keys(Privileges).filter(k => typeof Privileges[k as keyof typeof Privileges] === "number").reduce((acc, k) => acc | Privileges[k as keyof typeof Privileges], 0),
}

export const Descriptions = {
    [Privileges.ROOT]: <>
        A user with the <b>root</b> privilege can be described as the highest authority figure in a structured system or environment, holding the ultimate responsibility and power to manage, control, and oversee every aspect of that system. Those individuals has unrestricted access to all resources, decisions, and actions within the domain, ensuring that everything operates smoothly and efficiently. However, with this unparalleled control comes the need for great care, as any mistake or misuse can have far-reaching consequences.<br/><br/><b>
        Note:</b> This is the highest privilege level in WiFiWeb and should be used with caution.
    </>,
    [Privileges.MANAGE_USERS]: <>
        A user with the <b>manage users</b> privilege can create, modify, and delete user accounts within WiFiWeb. This includes setting usernames, passwords, and access levels, as well as managing any other user-related settings or configurations. By having this privilege, the user can help ensure that the system remains secure, organized, and efficient by overseeing who has access to what resources and information.<br/><br/><b>
        Note:</b> This privilege does not grant the ability to create, modify or delete users with higher privileges.
    </>,
    [Privileges.MANAGE_NETWORKS]: <>
        A user with the <b>manage networks</b> privilege can create, modify, and manage network configurations within WiFiWeb. This includes setting up new networks, changing network settings, and choosing which network to connect to / disconnect from. By having this privilege, the user can help ensure that the system remains connected, secure, and efficient by overseeing the network infrastructure and ensuring that it meets the needs of the users.
    </>,
}

export const FriendlyNames = {
    [Privileges.ROOT]: "ROOT",
    [Privileges.MANAGE_USERS]: "Manage Users",
    [Privileges.MANAGE_NETWORKS]: "Manage Networks",
}



export default class UserPrivileges {
    private privileges = 0



    constructor(privileges: number) {
        this.privileges = privileges
    }

    public toMask() {
        return this.privileges
    }

    public has(check: number, rootCheck: boolean = true) {
        return (this.privileges & check) === check || (rootCheck && (this.privileges & Privileges.ROOT) === Privileges.ROOT)
    }

    public add(add: number) {
        this.privileges |= add
    }

    public remove(remove: number) {
        this.privileges &= ~remove
    }

    public toStringArray() {
        const privs = Object.keys(Privileges).filter(k => typeof Privileges[k as keyof typeof Privileges] === "number")
        const ret = []
        for (const priv of privs) {
            if (this.has(Privileges[priv as keyof typeof Privileges], false)) {
                ret.push(priv)
            }
        }
        return ret
    }

    public toString() {
        return this.toStringArray().join(", ")
    }

}