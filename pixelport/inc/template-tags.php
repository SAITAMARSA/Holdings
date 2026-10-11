<?php
/**
 * Small template helpers shared across templates.
 *
 * @package PixelPort
 */

defined( 'ABSPATH' ) || exit;

/**
 * Site logo if one is set, otherwise the gradient mark and site name.
 */
function pixelport_brand() {
	if ( has_custom_logo() ) {
		echo '<div class="brand brand-logo">';
		the_custom_logo();
		echo '</div>';
		return;
	}
	?>
	<a class="brand" href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home">
		<span class="brand-mark" aria-hidden="true">🎮</span>
		<?php bloginfo( 'name' ); ?>
	</a>
	<?php
}

/**
 * Header links shown until a menu is assigned to the "Header menu" location.
 *
 * @param array $args wp_nav_menu() arguments.
 * @return string|void
 */
function pixelport_menu_fallback( $args = array() ) {
	$links = array( array( home_url( '/' ), __( 'Home', 'pixelport' ), is_front_page() ) );

	if ( function_exists( 'wc_get_page_permalink' ) && wc_get_page_id( 'shop' ) > 0 ) {
		$links[] = array( wc_get_page_permalink( 'shop' ), __( 'Shop', 'pixelport' ), is_shop() );
	}

	$arcade = pixelport_arcade_url();
	if ( $arcade ) {
		$links[] = array( $arcade, __( 'Arcade', 'pixelport' ), is_page_template( 'page-templates/arcade.php' ) );
	}

	$posts_page = (int) get_option( 'page_for_posts' );
	if ( $posts_page ) {
		$links[] = array( get_permalink( $posts_page ), get_the_title( $posts_page ), is_home() );
	}

	$html = '<ul class="menu">';
	foreach ( $links as $link ) {
		list( $url, $label, $is_current ) = $link;
		$html                            .= sprintf(
			'<li class="menu-item"><a href="%1$s"%2$s>%3$s</a></li>',
			esc_url( $url ),
			$is_current ? ' aria-current="page"' : '',
			esc_html( $label )
		);
	}
	$html .= '</ul>';

	if ( isset( $args['echo'] ) && ! $args['echo'] ) {
		return $html;
	}
	echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above.
}

/**
 * Permalink of the first published page using the Arcade template.
 *
 * @return string Empty when there is no such page.
 */
function pixelport_arcade_url() {
	$pages = get_pages(
		array(
			'meta_key'   => '_wp_page_template', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
			'meta_value' => 'page-templates/arcade.php', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
			'number'     => 1,
		)
	);

	return $pages ? get_permalink( $pages[0] ) : '';
}

/**
 * Up to two uppercase initials from a title, e.g. "Nova Drift" -> "ND".
 *
 * @param string $title Title.
 * @return string
 */
function pixelport_initials( $title ) {
	$words    = preg_split( '/\s+/u', trim( wp_strip_all_tags( $title ) ), -1, PREG_SPLIT_NO_EMPTY );
	$initials = '';
	foreach ( array_slice( $words, 0, 2 ) as $word ) {
		$initials .= mb_substr( $word, 0, 1 );
	}

	return mb_strtoupper( $initials );
}

/**
 * Accent colour for a product's fallback artwork.
 *
 * Uses the colour saved on the product, otherwise picks one from the
 * original PixelPort palette so neighbouring cards differ.
 *
 * @param int $post_id Post ID.
 * @return string Hex colour.
 */
function pixelport_accent_for( $post_id ) {
	$saved = sanitize_hex_color( get_post_meta( $post_id, '_pixelport_accent', true ) );
	if ( $saved ) {
		return $saved;
	}

	$palette = array( '#7c5cff', '#ff5c7c', '#3ec7a8', '#ffa53e', '#4cc2ff', '#c77dff', '#46d39a', '#ff7a45' );

	return $palette[ absint( $post_id ) % count( $palette ) ];
}

/**
 * Gradient-and-initials artwork used when a product has no image.
 *
 * @param int    $post_id     Post ID.
 * @param string $extra_class Extra class names.
 * @return string
 */
function pixelport_art_html( $post_id, $extra_class = '' ) {
	return sprintf(
		'<span class="pp-art %1$s" style="--art:%2$s" role="img" aria-label="%3$s"><span aria-hidden="true">%4$s</span></span>',
		esc_attr( $extra_class ),
		esc_attr( pixelport_accent_for( $post_id ) ),
		esc_attr( get_the_title( $post_id ) ),
		esc_html( pixelport_initials( get_the_title( $post_id ) ) )
	);
}

/**
 * Date, author and categories line for posts.
 */
function pixelport_post_meta() {
	$parts = array(
		sprintf(
			'<time datetime="%1$s">%2$s</time>',
			esc_attr( get_the_date( DATE_W3C ) ),
			esc_html( get_the_date() )
		),
	);

	$author = get_the_author();
	if ( $author ) {
		$parts[] = sprintf(
			/* translators: %s: post author name. */
			esc_html__( 'by %s', 'pixelport' ),
			'<a href="' . esc_url( get_author_posts_url( get_the_author_meta( 'ID' ) ) ) . '">' . esc_html( $author ) . '</a>'
		);
	}

	$categories = get_the_category_list( ', ' );
	if ( $categories && 'post' === get_post_type() ) {
		$parts[] = $categories;
	}

	echo '<div class="entry-meta">' . implode( ' · ', $parts ) . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- parts escaped above.
}

/**
 * Heading and intro for the blog, archives and search results.
 *
 * @return array{title: string, text: string}
 */
function pixelport_listing_heading() {
	if ( is_search() ) {
		return array(
			/* translators: %s: search query. */
			'title' => sprintf( __( 'Results for “%s”', 'pixelport' ), get_search_query() ),
			'text'  => '',
		);
	}

	if ( is_archive() ) {
		return array(
			'title' => wp_strip_all_tags( get_the_archive_title() ),
			'text'  => wp_strip_all_tags( get_the_archive_description() ),
		);
	}

	$posts_page = (int) get_option( 'page_for_posts' );

	return array(
		'title' => $posts_page ? get_the_title( $posts_page ) : pixelport_mod( 'news_title' ),
		'text'  => pixelport_mod( 'news_text' ),
	);
}
