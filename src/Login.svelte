<script>
	import { login, user_store, yemot_api } from "./user";
	let user, pass, error;

	function handleSubmit() {
		login(user, pass);

		yemot_api
			.get_incoming_calls()
			.then(() => {
				user_store.set({ is_login: true, user, pass });
			})
			.catch((reason) => {
				error = reason.toString();
			});
	}
</script>

<form on:submit|preventDefault={handleSubmit}>
	<h1>📞</h1>

	{#if error}
		<div class="error">
			<p>
				{error}
			</p>
		</div>
	{/if}

	<label for="user">מספר מערכת</label>
	<input name="user" placeholder="0773137770" bind:value={user} />

	<label for="password">סיסמא</label>
	<input
		name="password"
		type="password"
		placeholder="******"
		bind:value={pass}
	/>

	<button type="submit">כניסה 🔑</button>
</form>

<style>
	form {
		border: 1px solid #888;
		background: #fff;
		padding: 50px;
		width: 250px;
		height: 400px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		box-shadow: 0px 20px 14px 8px rgba(0, 0, 0, 0.58);
	}

	label {
		margin: 10px 0;
		/* align-self: flex-start; */
		font-weight: 500;
		text-align: center;
	}

	input {
		border: none;
		border-bottom: 1px solid #ccc;
		margin-bottom: 20px;
		transition: all 300ms ease-in-out;
		width: 100%;
		text-align: center;
	}

	input:focus {
		outline: 0;
		border-bottom: 1px solid #666;
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

	.error {
		margin: 0 0 10px 0;
		text-align: center;
		border: solid 1px #c15151;
		background-color: #fbc8c8;
		color: #820808;
		font-weight: bold;
	}
</style>
