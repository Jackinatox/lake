export type Allocation = {
    id: number;
    ip: string;
    ip_alias: string | null;
    port: number;
    notes: string | null;
    is_default: boolean;
};

export type AllocationResponse = {
    object: 'allocation';
    attributes: Allocation;
};

export type AllocationListResponse = {
    object: 'list';
    data: AllocationResponse[];
};

export type PtErrorResponse = {
    errors: Array<{
        code: string;
        status: string;
        detail: string;
    }>;
};
