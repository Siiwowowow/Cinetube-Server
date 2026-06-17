/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import z from "zod";

export const validateRequest = (zodSchema: z.ZodObject<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const schemaKeys = Object.keys(zodSchema.shape || {});
        const hasTopLevelProps = schemaKeys.some(key => ['body', 'query', 'params'].includes(key));

        let parsedResult;
        if (hasTopLevelProps) {
            parsedResult = zodSchema.safeParse({
                body: req.body,
                query: req.query,
                params: req.params
            });
        } else {
            parsedResult = zodSchema.safeParse(req.body);
        }

        if (!parsedResult.success) {
            return next(parsedResult.error);
        }

        if (hasTopLevelProps) {
            if (parsedResult.data.body !== undefined) req.body = parsedResult.data.body;
            if (parsedResult.data.query !== undefined) req.query = parsedResult.data.query as any;
            if (parsedResult.data.params !== undefined) req.params = parsedResult.data.params as any;
        } else {
            req.body = parsedResult.data;
        }

        next();
    }
}