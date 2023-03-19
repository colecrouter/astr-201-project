<script lang="ts">
    import { base } from '$app/paths';
    import 'bootstrap/dist/css/bootstrap.min.css';
</script>

<svelte:head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Bluetooth Sundial</title>
    <meta name="author" content="Cole Crouter & Braden Breit" />
</svelte:head>

<!-- GITHUB LOGO -->
<a href="https://github.com/Mexican-Man/astr-201-project" aria-label="GitHub repository link" target="_blank" rel="noreferrer">
    <img src="github-mark-white.svg" alt="Github Logo" />
</a>

<slot />

<style>
    :global(html),
    :global(body) {
        padding: 0 !important;
        margin: 0 !important;
        overflow: visible !important;
    }

    a {
        position: absolute;
        top: 0;
        right: 0;
        z-index: 1;
        padding: 1rem;
    }

    a > img {
        width: 3rem;
        height: 3rem;
        transition: filter 0.2s ease-in-out;
    }

    a > img:hover {
        filter: brightness(0.8);
    }
</style>
