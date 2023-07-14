import { Method, AxiosRequestConfig, AxiosError, AxiosInstance } from "axios";
import { ZodType, z } from "zod";

export function removeNulls<T>(obj: T | any) {
	const newObj = structuredClone(obj);

	for (const key of Object.keys(newObj)) {
		if (newObj[key] && typeof newObj[key] === "object")
			removeNulls(newObj[key]);
		else if (newObj[key] == null) delete newObj[key];
	}

	return newObj as Partial<T>;
}

export type UndefinedToNull<T> = T extends object
	? UndefinedToNullObject<T>
	: T | undefined extends T
	? T | null
	: T;

type UndefinedToNullObject<T> = { [K in keyof T]: UndefinedToNull<T[K]> };

export type AxiosReturnType<PostProcessor, OutputSchema> =
	PostProcessor extends (...args: any[]) => infer Q
		? Q
		: OutputSchema extends ZodType
		? z.output<OutputSchema>
		: unknown;

export interface MakeAxiosRequestInput<
	BodySchema,
	ParamsSchema,
	OutputSchema,
	PostProcessor,
	RemoveNulls,
> {
	method: Method;
	url: string;
	baseURL?: string;
	data?: BodySchema extends ZodType
		? RemoveNulls extends true
			? UndefinedToNull<z.input<BodySchema>>
			: z.input<BodySchema>
		: AxiosRequestConfig["data"];
	dataSchema?: BodySchema;
	paramsSchema?: ParamsSchema;
	outputSchema?: OutputSchema;
	extraBody?: AxiosRequestConfig["data"];
	headers?: AxiosRequestConfig["headers"];
	params?: ParamsSchema extends ZodType
		? RemoveNulls extends true
			? UndefinedToNull<z.input<ParamsSchema>>
			: z.input<ParamsSchema>
		: AxiosRequestConfig["params"];
	extraParams?: AxiosRequestConfig["params"];
	preProcessor?: (data: unknown) => unknown;
	postProcessor?: PostProcessor;
	errorHandler?: (err: AxiosError) => any;
	axiosInstance?: AxiosInstance;
	retry?: boolean;
	queue?: {
		key: string;
		delay?: number;
	};
	responseType?: AxiosRequestConfig["responseType"];
	removeNulls?: RemoveNulls;
}
