// 24 -> 255.255.255.0

export function subnetMaskToCIDR(mask: string): number {
    return mask.split('.').map(Number).reduce((a, b) => a + b.toString(2).split('1').length - 1, 0);
}

export function CIDRToSubnetMask(cidr: number, includeCount: boolean = false): string {
    if (cidr == null) return ""
    const match = ('1'.repeat(cidr) + '0'.repeat(32 - cidr)).match(/.{8}/g);
    if (!match) {
        throw new Error('Invalid CIDR value');
    }
    return match.map(bin => parseInt(bin, 2)).join('.') + (includeCount ? ` (${CIDRtoAmount(cidr)} addrs)` : '');
}

export function CIDRtoAmount(cidr: number): number {
    return 2 ** (32 - cidr);
}

export function subnetMaskToAmount(mask: string): number {
    return CIDRtoAmount(subnetMaskToCIDR(mask));
}