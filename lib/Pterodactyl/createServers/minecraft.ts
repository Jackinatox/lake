import { createPtClient } from "../ptAdminClient";

interface BookPaper {
    ptUser: number,
    cpu: number,
    mem: number,
    eggId: number,
}

export function bookPaper(data: BookPaper) {

    const pt = createPtClient();

    pt.createServer({
        user: data.ptUser,
        limits: {
            cpu: data.cpu,
            disk: 0,
            memory: data.mem,
            io: 500,
            swap: 0
        },
        egg: data.eggId,
        name: '',
        environment: {

        },
        startup: '',
        featureLimits: {
            allocations: 1,
            backups: 0,
            databases: 0,
            split_limit: 0
        }

    })

}