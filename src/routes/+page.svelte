<script lang="ts">
    import { browser } from '$app/environment';
    import Hero from '$lib/Hero.svelte';
    import LocationPopover from '$lib/LocationPopover.svelte';
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { BluetoothSundial } from '../lib/BluetoothDevice';
    import ListGroup from '../lib/ListGroup.svelte';

    const bluetoothSundial = new BluetoothSundial();
    const sundialData = bluetoothSundial.data;
    const connected = bluetoothSundial.connected;

    const userLocale = (browser && navigator.languages && (navigator.languages.length ? navigator.languages[0] : navigator.language)) || 'en-US';
    const userLocation = writable<GeolocationPosition>();

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
            <ListGroup {userLocale} data={sundialData} />
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
