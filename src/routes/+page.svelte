<script lang="ts">
    import { browser } from '$app/environment';
    import Hero from '$lib/Hero.svelte';
    import LocationPopover from '$lib/LocationPopover.svelte';
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { BluetoothSundial } from '$lib/BluetoothSundial';
    import ListGroup from '$lib/ListGroup.svelte';

    const userLocale = (browser && navigator.languages && (navigator.languages.length ? navigator.languages[0] : navigator.language)) || 'en-US';
    const userLocation = writable<GeolocationPosition>();

    const bluetoothSundial = new BluetoothSundial(userLocation);
    const sundialData = bluetoothSundial.data;
    const connected = bluetoothSundial.connected;

    let body: HTMLElement | null;
    // In browser only
    onMount(() => {
        // We want to run this before the page loads, so we don't flashbang the user
        body?.setAttribute('data-bs-theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    });
</script>

<!-- This lets use "trigger" a request for geolocation data, because the user clicked on something first -->
{#if $connected}
    <LocationPopover location={userLocation} />
{/if}

<Hero {bluetoothSundial} {userLocale} />

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
                    Check out <a href="https://github.com/Mexican-Man/astr-201-project" rel="noreferrer" target="_blank">the repo</a> for the source code and schematic for the device.
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
        padding: 0 3rem;
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
