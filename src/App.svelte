<script>
	import Login from "./Login.svelte";
	import Calls from "./Calls.svelte";
	import { user_store } from "./user";

</script>

<svelte:head>
	<title>שיחות פעילות</title>
	<html lang="he" />
</svelte:head>

<!-- <div class="container" />-->

<section>
	{#if !$user_store.is_login}
		<Login />
	{:else}
		<Calls />
	{/if}
</section>

<style>
	:global(body) {
		direction: rtl;
	}

	section {
		height: 95vh;
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		/*background: linear-gradient(to right, #cd76e2, #e358ab);*/
	}
</style>
