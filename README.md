# make-axios-request

Axios wrapper

## Installation

```shell
yarn add make-axios-request
```

## Usage

```javascript
import { makeAxiosRequest } from "make-axios-request";
import { z } from "zod";

const outputSchema = z.object({
	response: z.object({
		access_token: z.string(),
		token_type: z.string(),
		expires_in: z.number(),
		scope: z.string(),
		user_id: z.coerce.number(),
		refresh_token: z.string(),
	}),
});

// res is typed:
// {
//     access_token: string;
//     refresh_token: string;
//     token_type: string;
//     expires_in: number;
//     scope: string;
//     user_id: number;
// }
const res = await makeAxiosRequest({
	method: "post",
	baseURL: "http://api.example.com/",
	url: "/oauth/token",
	queue: {
		// All makeAxiosRequest calls with this key will enter a queue with a 100ms delay (default)
		key: "example_api_queue_key",
	},
	dataSchema: z.object({
		grant_type: z.literal("refresh_token"),
		client_id: z.string(),
		client_secret: z.string(),
		refresh_token: z.string(),
		user_id: z.string().optional(),
	}),
	// errors if not valid z.input of dataSchema
	data: {
		grant_type: "refresh_token",
		client_id: "123",
		client_secret: "123",
		refresh_token: "token",
		// user_id will error if removeNulls: true is not supplied, as the input schema is .optional()
		user_id: null,
	},
	paramsSchema: z.object({
		timestamp: z.number(),
		signature: z.string().optional(),
	}),
	params: {
		// Type 'string' is not assignable to type 'number'.ts(2322)
		timestamp: "error",
		signature: null,
	},
	removeNulls: true,
	outputSchema,
	postProcessor: (data: z.output<typeof outputSchema>) => data.response,
	retry: true,
});
```

## API

#### Input (Object)

- `url`: The URL to make the request
- `method`: The HTTP method like `get`, `post`, `put` etc.
- `baseURL` : The base url for the HTTP request
- `data` : The request body
- `dataSchema`: Zod schema for request body parsing.
- `params`: The URL parameters to send with request.
- `paramsSchema`: Zod schema for params parsing.
- `outputSchema`: Zod schema for response parsing.
- `extraBody`: Additional body parameters to send with the request.
- `headers`: The headers for the request.
- `extraParams`: Additional parameters to send with the request.
- `preProcessor`: A function that receives the raw axios return body and pre-processes it. useful if you only need to extract part of the response and do not want to create a schema for the the whole response. Not type-safe.
- `postProcessor`: A function that receives the response of the outputSchema (z.output) and returns adjusts the return of the makeAxiosRequest function, type-safe.
- `errorHandler`: Handles AxiosError.
- `axiosInstance`: Custom Axios instance to use for the request.
- `retry`: To retry the failed request. Uses axios-retry, max of 3 times.
- `queue`: If provided, queues the task.
  - `queue.key`: Unique key to the queue
  - `queue.delay`: Delay between tasks in the queue, in ms (100ms by default).
- `responseType`: Response data type
- `removeNulls`: Remove null values from params and body, useful if the input schema is has .optional() properties and your data can contain nulls that should be ignored.

## License

[MIT](https://choosealicense.com/licenses/mit/)
