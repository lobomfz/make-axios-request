type QueueTask = () => Promise<any>;
type QueueResponse =
	| { success: true; data: any }
	| { success: false; data: unknown };

class GenericQueue {
	private taskQueue: {
		task: QueueTask;
		resolve: (value: QueueResponse | PromiseLike<QueueResponse>) => void;
	}[] = [];

	private running = false;

	constructor(private delay: number = 100) {}

	async add(task: QueueTask) {
		const promise = new Promise<QueueResponse>(async (resolve) => {
			this.taskQueue.push({ task, resolve });
		});

		if (!this.running) {
			this.run();
		}

		return promise;
	}

	private async run(): Promise<void> {
		this.running = true;

		while (this.taskQueue.length > 0) {
			const currentTask = this.taskQueue.shift();

			if (!currentTask) continue;

			const { task, resolve } = currentTask;

			const result = await task()
				.then((data) => ({ success: true, data }))
				.catch((data) => ({ success: false, data }));

			resolve(result);

			if (this.delay > 0) await new Promise((r) => setTimeout(r, this.delay));
		}

		this.running = false;
	}
}

class GlobalQueue {
	private queues = new Map<string, GenericQueue>();

	private getQueue(data: { key: string; delay?: number }): GenericQueue {
		let queue = this.queues.get(data.key);

		if (!queue) {
			queue = new GenericQueue(data.delay);
			this.queues.set(data.key, queue);
		}

		return queue;
	}

	add(data: { delay?: number; task: QueueTask; key: string }) {
		const { delay, task, key } = data;

		const queue = this.getQueue({
			key,
			delay,
		});

		return queue.add(task);
	}
}

export const globalQueue = new GlobalQueue();
