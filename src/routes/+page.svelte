<script lang="ts">
    import { browser } from '$app/environment';
    import { BluetoothSundial } from '$lib/BluetoothSundial';
    import Hero from '$lib/Hero.svelte';
    import ListGroup from '$lib/ListGroup.svelte';
    import LocationPopover from '$lib/LocationPopover.svelte';
    import { onDestroy, onMount } from 'svelte';
    import { get, writable } from 'svelte/store';

    const userLocale = (browser && navigator.languages && (navigator.languages.length ? navigator.languages[0] : navigator.language)) || 'en-US';
    const userLocation = writable<GeolocationPosition>();

    const bluetoothSundial = new BluetoothSundial(userLocation);
    const sundialData = bluetoothSundial.data;
    const connected = bluetoothSundial.connected;

    let body: HTMLElement | null;
    let modalClickedOnce = false;
    // In browser only
    onMount(() => {
        // We want to run this before the page loads, so we don't flashbang the user
        body?.setAttribute('data-bs-theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    });

    // Mainly for development, so we don't have to keep refreshing the page
    onDestroy(() => {
        bluetoothSundial.disconnect();
    });

    const clickCallback = async () => {
        // We only really need to worry about this the first time the user clicks
        modalClickedOnce = true;

        /*
            First, wait for the user's location to be available, so the browser
            doesn't disallow permissions if they take too long to select the Bluetooth device
            We set modalClickedOnce to true so that the LocationPopover will load, which will
            either get the users location, or open the modal to ask for it
        */

        // Wait for the user's location to be available
        if (!get(userLocation)) {
            let unsub: () => void;
            await new Promise((resolve) => {
                // The first write to the store will be undefined, so we need to wait for the second write
                // hence, this unsub grossness
                unsub = userLocation.subscribe((v) => {
                    if (v) return;
                    resolve(null);
                });
            });
            unsub!(); // Unsub will always be defined here
        }

        // Then, attempt to connect to the device
        if (get(connected)) {
            bluetoothSundial.disconnect();
        } else {
            bluetoothSundial.connect();
        }
    };
</script>

<!-- This lets use "trigger" a request for geolocation data, because the user clicked on something first -->
{#if modalClickedOnce || $connected}
    <LocationPopover {userLocation} />
{/if}

<Hero {sundialData} {connected} {clickCallback} {userLocale} />

<section class="text-body" bind:this={body}>
    <article>
        <div class="content">
            {#if $sundialData}
                <ListGroup {userLocale} data={sundialData} />
            {:else}
                <p>
                    <strong>Bluetooth Sundial</strong> is a web app that connects to an Arduino-powerd device to display the current time. Click the text above to connect to a device.
                </p>
                <p>
                    A Sundial is a device that tells the time by measuring the angle of the sun. The angle of the sun changes throughout the day, and the angle of the sun changes throughout the year. By getting the current date from your
                    device, we can figure out roughly what time it is.
                </p>
                <p>
                    Check out <a href="https://github.com/Mexican-Man/astr-201-project" rel="noreferrer" target="_blank">the repo</a> for <strong>more info</strong>, the source code, and schematic for the device.
                </p>
            {/if}
        </div>
    </article>
</section>

<style>
    section {
        width: 100%;
        /* Body is light-mode because colour-mode nesting no worky, so we leave body with no mode, and just inherit some body properties here as dark-mode */
        color: var(--bs-body-color);
        background-color: var(--bs-body-bg);
    }

    section > article {
        display: flex;
        min-height: 20em;
    }

    section > article > .content {
        padding: 3rem;
        margin: 0 auto;
        max-width: 600px;
        width: 100%;
    }
</style>
