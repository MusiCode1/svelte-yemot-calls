<script>
	import { yemot_api, user_store } from "./user";
	let calls = -1,
		interval;

	async function get_calls() {
		const response = await yemot_api.get_incoming_calls();

		return response.data.callsCount;
	}

	async function set_calls() {
		calls = await get_calls();
	}

	function logout() {
		$user_store.is_login = false;
		clearInterval(interval);
	}

	interval = setInterval(set_calls, 1000);
</script>

<div class="window">
	<h1>סך השיחות למערכת:</h1>
	<p>
		{#if calls > -1}
			סך השיחות הפעילות למערכת כרגע הוא:
		{:else}
			בטעינה...
		{/if}
	</p>
	{#if calls > -1}
		<h2>
			{calls}
		</h2>
	{/if}
	<button on:click={logout}>יציאה 🔒</button>
</div>

<style>
	.window {
		background-color: #fcffea;
		padding: 50px;
		border: 1px solid #888;
		text-align: center;
		box-shadow: 0px 0px 14px 0px rgb(0 0 0 / 58%);
		transition: all 300ms ease-in-out;
	}

	.window:hover {
		background-color: #ffffff;
		box-shadow: 0px 0px 20px 15px rgb(0 0 0 / 58%);
	}

	button {
		margin-top: 20px;
		background: black;
		color: white;
		padding: 10px 0;
		width: 200px;
		border-radius: 25px;
		text-transform: uppercase;
		font-weight: bold;
		cursor: pointer;
		transition: all 300ms ease-in-out;
	}

	button:hover {
		transform: translateY(-2.5px);
		box-shadow: 0px 1px 10px 0px rgba(0, 0, 0, 0.58);
	}

	h1 {
		margin: 10px 20px 30px 20px;
		font-size: 40px;
	}

	p {
		margin: 10px 0;
		font-weight: 500;
		text-align: center;
	}
</style>
