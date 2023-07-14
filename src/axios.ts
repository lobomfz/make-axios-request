import axios, { AxiosInstance } from "axios";
import { z, ZodType } from "zod";
import type { AxiosReturnType, MakeAxiosRequestInput } from "./utils.js";
import { removeNulls } from "./utils.js";
import { globalQueue } from "./queue.js";
import axiosRetry, { IAxiosRetryConfig } from "axios-retry";

type IAxiosRetry = (
	AxiosInstance: AxiosInstance,
	retryConfig: IAxiosRetryConfig
) => void;

export async function makeAxiosRequest<
	BodySchema extends ZodType | undefined,
	OutputSchema extends ZodType | undefined,
	ParamsSchema extends ZodType | undefined,
	PostProcessor extends
		| ((
				data: OutputSchema extends ZodType ? z.output<OutputSchema> : never
		  ) => any)
		| undefined,
	RemoveNulls extends boolean | undefined,
>(
	input: MakeAxiosRequestInput<
		BodySchema,
		ParamsSchema,
		OutputSchema,
		PostProcessor,
		RemoveNulls
	>
): Promise<AxiosReturnType<PostProcessor, OutputSchema>> {
	const makeRequest = () => {
		let promise = axiosInstance({
			method: input.method,
			data,
			baseURL: input.baseURL,
			url: input.url,
			headers: input.headers ?? {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			params,
			responseType: input.responseType,
		}).then((res) => res.data);

		if (input.errorHandler) {
			promise = promise.catch(input.errorHandler);
		}

		return promise;
	};

	const parsedSchema: BodySchema extends ZodType
		? z.output<BodySchema>
		: BodySchema = input.dataSchema
		? input.removeNulls
			? input.dataSchema.parse(removeNulls(input.data))
			: input.dataSchema.parse(input.data)
		: input.data;

	const parsedParams: ParamsSchema extends ZodType
		? z.output<ParamsSchema>
		: ParamsSchema = input.paramsSchema
		? input.paramsSchema.parse(input.params)
		: input.params;

	const data =
		input.extraBody && parsedSchema
			? Object.assign(parsedSchema, input.extraBody)
			: parsedSchema;

	const params =
		input.extraParams && parsedParams
			? Object.assign(parsedParams, input.extraParams)
			: parsedParams;

	const axiosInstance = input.axiosInstance ?? axios;

	if (input.retry) {
		(axiosRetry as any as IAxiosRetry)(axiosInstance, {
			retries: 3,
			retryDelay: axiosRetry.exponentialDelay,
		});
	}

	let res: unknown;

	if (input.queue) {
		const queueRes = await globalQueue.add({
			key: input.queue.key,
			delay: input.queue.delay,
			task: () => makeRequest(),
		});

		if (queueRes.success) res = queueRes.data;
		else throw queueRes.data;
	} else {
		res = await makeRequest();
	}

	const processedRes = input.preProcessor ? input.preProcessor(res) : res;

	if (input.outputSchema) {
		const output = input.outputSchema.parse(processedRes);

		if (output.success) {
			return input.postProcessor
				? input.postProcessor(output.data)
				: output.data;
		}

		throw output.error;
	}

	return processedRes as any;
}
