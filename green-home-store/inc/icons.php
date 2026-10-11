<?php
/**
 * Inline SVG icons (24×24, stroked with currentColor), so the theme needs no
 * icon font or CDN.
 *
 * @package GreenHomeStore
 */

defined( 'ABSPATH' ) || exit;

/**
 * SVG markup for a named icon. Output is static markup built from the list
 * below, so it is safe to echo.
 *
 * @param string $name  Icon name.
 * @param int    $size  Width and height in pixels.
 * @return string Empty string for unknown names.
 */
function ghstore_icon( $name, $size = 24 ) {
	$paths = array(
		'bolt'      => '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
		'shield'    => '<path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6l-8-3z"/><path d="m9 12 2 2 4-4"/>',
		'sun'       => '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
		'battery'   => '<rect x="2" y="7" width="17" height="10" rx="2"/><path d="M22 11v2M6 10v4M10 10v4"/>',
		'panel'     => '<path d="M3 4h18l-2 10H5L3 4z"/><path d="M12 4v10M4 9h16M12 14v5M8 20h8"/>',
		'wrench'    => '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4 2.5-2.5z"/>',
		'support'   => '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="2" y="14" width="5" height="6" rx="1.5"/><rect x="17" y="14" width="5" height="6" rx="1.5"/>',
		'installer' => '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="m16 11 2 2 4-4"/>',
		'phone'     => '<path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 7 7L16 14l5 2v3a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
		'whatsapp'  => '<path d="M3.5 20.5 5 16a8.5 8.5 0 1 1 3 3l-4.5 1.5z"/><path d="M9 8.6c0 3.4 2.9 6.4 6.4 6.4l1.1-1.6-2.1-1-1 .8a4 4 0 0 1-2.4-2.4l.8-1-1-2.1L9 8.6z"/>',
		'mail'      => '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
		'pin'       => '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
		'clock'     => '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
		'check'     => '<path d="m5 12 5 5 9-10"/>',
		'home'      => '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
		'building'  => '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10 21v-3h4v3"/>',
		'leaf'      => '<path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="m5 19 7-7"/>',
		'savings'   => '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
		'plug'      => '<path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0V8zM12 17v5"/>',
		'chat'      => '<path d="M21 12a8 8 0 0 1-12 7l-5 1 1-4.5A8 8 0 1 1 21 12z"/>',
		'design'    => '<path d="m4 20 1-4L16 5l3 3L8 19l-4 1z"/><path d="m14 7 3 3"/>',
		'cart'      => '<path d="M6 7h12l-1 13H7L6 7zm3 0V6a3 3 0 0 1 6 0v1"/>',
		'arrow'     => '<path d="M5 12h14M13 6l6 6-6 6"/>',
		'menu'      => '<path d="M4 6h16M4 12h16M4 18h16"/>',
		'value'     => '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M12 17v-6M9.5 13.5 12 11l2.5 2.5"/>',
		'calendar'  => '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
		'star'      => '<path fill="currentColor" stroke="none" d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3z"/>',
	);

	if ( ! isset( $paths[ $name ] ) ) {
		return '';
	}

	return sprintf(
		'<svg class="icon icon-%1$s" width="%2$d" height="%2$d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">%3$s</svg>',
		esc_attr( $name ),
		absint( $size ),
		$paths[ $name ]
	);
}

/**
 * Echo an icon.
 *
 * @param string $name Icon name.
 * @param int    $size Size in pixels.
 */
function ghstore_icon_e( $name, $size = 24 ) {
	echo ghstore_icon( $name, $size ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG markup.
}
