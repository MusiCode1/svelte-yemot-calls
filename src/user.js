import { writable } from "svelte/store"
import Yemot_api from "yemot-api"
import cookies from "js-cookie"

export const user_store = writable({
	is_login: false,
	user: "", pass: ""
});

export let yemot_api = new Yemot_api();

export function login(user, pass) {

	yemot_api = new Yemot_api(user, pass);
};

export function check_coockie() {

	const cookie = cookies.get("certificates");

	if (cookie) {
		const certificates = JSON.parse(cookie);

		const { user, pass } = certificates;

		if (user && pass) {

			login(user, pass);

			yemot_api
				.get_incoming_calls()
				.then(() => {
					user_store.set({ is_login: true, user, pass });
				})
				.catch((reason) => {
					error_element = reason.toString();
				});
		}
	}
}

user_store.subscribe((value) => {

	if (value.is_login) {
		const json = JSON.stringify({
			user: value.user,
			pass: value.pass,
		});

		cookies.set("certificates", json);

	} else {
		if (value.user && value.pass) {
			value.user = value.pass = "";
			cookies.set("certificates", "");
		}
	}
});
