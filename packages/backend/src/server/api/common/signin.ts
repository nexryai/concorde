import Koa from "koa";

import { ILocalUser } from "@/models/entities/user.js";
import { Signins } from "@/models/index.js";
import { genId } from "@/misc/gen-id.js";
import { publishMainStream } from "@/services/stream.js";

export default function(ctx: Koa.Context, user: ILocalUser) {
    ctx.body = {
        id: user.id,
        i: user.token,
    };
    ctx.status = 200;

    (async () => {
        // Append signin history
        const record = await Signins.insert({
            id: genId(),
            createdAt: new Date(),
            userId: user.id,
            ip: ctx.ip,
            // @ts-ignore
            headers: ctx.headers,
            success: true,
        }).then(x => Signins.findOneByOrFail(x.identifiers[0]));

        // Publish signin event
        publishMainStream(user.id, "signin", await Signins.pack(record));
    })();
}
