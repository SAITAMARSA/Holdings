<?php
/**
 * Plugin Name: Visionary Africa Sources
 * Description: Adds a Sources box to posts and prints an AI-assisted disclosure plus linked sources at the end of each article.
 * Version: 1.0.0
 * Requires PHP: 8.0
 * License: GPL-2.0-or-later
 * Text Domain: va-sources
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const VA_SOURCES_META = '_va_sources';
const VA_AI_META      = '_va_ai_assisted';

/** Meta box. */
add_action( 'add_meta_boxes', function () {
	add_meta_box( 'va-sources', __( 'Sources and disclosure', 'va-sources' ), 'va_sources_box', 'post', 'normal', 'default' );
} );

function va_sources_box( WP_Post $post ): void {
	wp_nonce_field( 'va_sources_save', 'va_sources_nonce' );
	$sources = get_post_meta( $post->ID, VA_SOURCES_META, true );
	$sources = is_array( $sources ) ? $sources : array();
	$ai      = get_post_meta( $post->ID, VA_AI_META, true );
	$ai      = ( '' === $ai ) ? '1' : $ai; // On by default.
	?>
	<p>
		<label>
			<input type="checkbox" name="va_ai_assisted" value="1" <?php checked( $ai, '1' ); ?>>
			<?php esc_html_e( 'Researched with AI assistance (shows a disclosure at the end of the article)', 'va-sources' ); ?>
		</label>
	</p>
	<p><?php esc_html_e( 'One source per line, as: Title | https://link', 'va-sources' ); ?></p>
	<textarea name="va_sources" rows="6" style="width:100%"><?php
		foreach ( $sources as $s ) {
			echo esc_textarea( $s['title'] . ' | ' . $s['url'] ) . "\n";
		}
	?></textarea>
	<?php
}

add_action( 'save_post_post', function ( int $post_id ) {
	if ( ! isset( $_POST['va_sources_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['va_sources_nonce'] ) ), 'va_sources_save' ) ) {
		return;
	}
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	update_post_meta( $post_id, VA_AI_META, isset( $_POST['va_ai_assisted'] ) ? '1' : '0' );

	$raw     = isset( $_POST['va_sources'] ) ? sanitize_textarea_field( wp_unslash( $_POST['va_sources'] ) ) : '';
	$sources = array();
	foreach ( preg_split( '/\R/', $raw ) as $line ) {
		$parts = array_map( 'trim', explode( '|', $line, 2 ) );
		$url   = esc_url_raw( $parts[1] ?? $parts[0] );
		if ( '' === $url ) {
			continue;
		}
		$title = isset( $parts[1] ) ? $parts[0] : wp_parse_url( $url, PHP_URL_HOST );
		$sources[] = array( 'title' => $title, 'url' => $url );
	}
	update_post_meta( $post_id, VA_SOURCES_META, $sources );
} );

/** Output on single posts. */
add_filter( 'the_content', function ( string $content ): string {
	if ( ! is_singular( 'post' ) || ! in_the_loop() || ! is_main_query() ) {
		return $content;
	}
	$id      = get_the_ID();
	$ai      = get_post_meta( $id, VA_AI_META, true );
	$sources = get_post_meta( $id, VA_SOURCES_META, true );
	$out     = '';

	if ( '0' !== $ai ) {
		$out .= '<p class="va-disclosure"><em>' . esc_html__( 'Researched with AI assistance and edited by Visionary Africa.', 'va-sources' ) . '</em></p>';
	}
	if ( is_array( $sources ) && $sources ) {
		$out .= '<div class="va-sources"><h2>' . esc_html__( 'Sources', 'va-sources' ) . '</h2><ul>';
		foreach ( $sources as $s ) {
			$out .= '<li><a href="' . esc_url( $s['url'] ) . '" rel="noopener nofollow" target="_blank">' . esc_html( $s['title'] ) . '</a></li>';
		}
		$out .= '</ul></div>';
	}
	return $content . $out;
}, 20 );
