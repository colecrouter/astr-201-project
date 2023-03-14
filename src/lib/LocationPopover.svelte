<script lang="ts">
    import geoIcon from 'bootstrap-icons/icons/geo-alt-fill.svg';
    import { onMount } from 'svelte';
    import type { Writable } from 'svelte/store';

    export let location: Writable<GeolocationPosition>;

    let offcanvasElement: HTMLElement;
    let form: HTMLFormElement;
    let havePerms = true;

    onMount(async () => {
        // First, ask the user for their location
        havePerms = await checkPermissionAndUpdate();
        if (havePerms) return;

        // Otherwise, we'll create a popover to ask the user for their location
        const { default: OffCanvas } = await import('bootstrap/js/dist/offcanvas');
        const offcanvas = new OffCanvas(offcanvasElement, { scroll: false });

        const storedLong = localStorage.getItem('longitude');
        const storedLat = localStorage.getItem('latitude');

        if (storedLong && storedLat) {
            updateLongLat(parseFloat(storedLong), parseFloat(storedLat));

            // Set default values
            (document.getElementById('longitude') as HTMLInputElement).value = storedLong;
            (document.getElementById('latitude') as HTMLInputElement).value = storedLat;
        }

        // Open the offcanvas, as if we're prompting the user for their location
        offcanvas.show();

        // Repetitively check for permission until we have it, then update the location
        const interval = setInterval(async () => {
            if ((havePerms = await checkPermissionAndUpdate())) {
                clearInterval(interval);

                // Dismiss the offcanvas because we have permission now
                offcanvas.hide();
            }
        }, 1000);
    });

    const updateLongLat = (longitude: number, latitude: number) => {
        // Update the location
        location.set({
            coords: {
                accuracy: 0,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                longitude,
                latitude,
                speed: null,
            },
            timestamp: Date.now(),
        });
    };

    const formHandler = (e: Event) => {
        // Validate the longitude and latitude are valid numbers
        const longitude = parseFloat(form.longitude.value);
        const latitude = parseFloat(form.latitude.value);
        if (!longitude || !latitude || isNaN(longitude) || isNaN(latitude)) {
            return;
        }

        localStorage.setItem('longitude', longitude.toString());
        localStorage.setItem('latitude', latitude.toString());

        // Update the location
        updateLongLat(longitude, latitude);
    };

    const checkPermissionAndUpdate = async () => {
        if ('geolocation' in navigator) {
            const checkPerms = await navigator.permissions.query({ name: 'geolocation' });
            if (checkPerms.state === 'denied') return false;

            // Assuming we have permission, get the location
            const pos = (await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject)).catch((err) => err)) as GeolocationPosition | GeolocationPositionError;
            if (pos instanceof GeolocationPosition) {
                location.set(pos);
                return true;
            }
        }

        return false;
    };

    let textInputs = [
        ['Longitude', /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/],
        ['Latitude', /^[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/],
    ] as const;
</script>

<!-- onClick wrapper for everything -->
<div id="wrapper">
    <!-- Bootstrap Offcanvas -->
    <div class="offcanvas offcanvas-start" tabindex="-1" id="offcanvasExample" aria-labelledby="offcanvasExampleLabel" bind:this={offcanvasElement}>
        <div class="offcanvas-header">
            <h5 class="offcanvas-title" id="offcanvasExampleLabel">Location</h5>
            <button type="button" class="btn-close text-reset position-static" data-bs-dismiss="offcanvas" aria-label="Close" />
        </div>
        <div class="offcanvas-body">
            <div>
                <i class="lead">Unable to get your location</i>
                <hr />
                Either:
                <ul>
                    <li>Allow location access then reload</li>
                    <li>Enter your longitude & latitude manually</li>
                </ul>
                <br />
                <form
                    class="row g-3 mx-2"
                    bind:this={form}
                    on:submit|preventDefault|stopPropagation={(e) => {
                        formHandler(e);
                    }}>
                    {#each textInputs as set}
                        <div class="col-6">
                            <label for={set[0]?.toLowerCase()} class="visually-hidden">{set[0]}</label>
                            <input
                                type="text"
                                class="form-control"
                                id={set[0]?.toLowerCase()}
                                name={set[0]?.toLowerCase()}
                                placeholder={set[0]}
                                pattern={set[1].source}
                                on:input={() => {
                                    form.requestSubmit();
                                }}
                                required />
                        </div>
                    {/each}
                    <div class="col-12" />
                </form>
            </div>
        </div>
    </div>

    {#if !havePerms}
        <!-- Floating button on bottom right of screen -->
        <button type="button" class="btn btn-primary" data-bs-toggle="offcanvas" data-bs-target="#offcanvasExample" aria-controls="offcanvasExample">
            <object type="image/svg+xml" data={geoIcon} aria-label="Location icon" />
        </button>
    {/if}
</div>

<style>
    button {
        bottom: 1rem;
        right: 1rem;
        z-index: 1;
        position: fixed;
        display: inline;
        font-size: 2em;
    }

    button > object {
        filter: invert(1);
        /* Stop the image from blocking the button */
        pointer-events: none;
        width: 32px;
        height: 32px;
    }
</style>
