<script>
	import { fade, fly } from "svelte/transition";
	import Login from "./Login.svelte";
	import Calls from "./Calls.svelte";
	import { user_store } from "./user";

	const o = {
		delay: 500,
		y: -200,
	};
</script>

<svelte:head>
	<title>שיחות פעילות</title>
	<html lang="he" />
</svelte:head>

<!-- <div class="container" />-->

<main>
	<div>
		{#if !$user_store.is_login}
			<div in:fly={o} out:fade class="content">
				<Login />
			</div>
		{:else}
			<div in:fly={o} out:fade class="content">
				<Calls />
			</div>
		{/if}
	</div>
</main>

<style>
	:global(body) {
		direction: rtl;
		padding: 0;
	}

	main {
		height: 100%;
		width: 100%;
		/* display: flex;
		justify-content: center;
		align-items: center; */
		background: linear-gradient(to right, #cd76e2, #e358ab);
	}

	.content {
		position: absolute;
		top: 50%;
		left: 50%;
		-ms-transform: translate(-50%, -50%);
		transform: translate(-50%, -50%);
	}
</style>
