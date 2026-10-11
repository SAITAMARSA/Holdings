<?php
/**
 * Template helpers: brand, menus, contact links.
 *
 * @package GreenHomeStore
 */

defined( 'ABSPATH' ) || exit;

/**
 * Logo linking home: the Customizer logo if set, otherwise the bundled
 * Green Home Systems logo.
 *
 * @param string $context "header" or "footer".
 */
function ghstore_brand( $context = 'header' ) {
	if ( has_custom_logo() ) {
		echo '<div class="brand brand-' . esc_attr( $context ) . '">';
		the_custom_logo();
		echo '</div>';
		return;
	}
	?>
	<a class="brand brand-<?php echo esc_attr( $context ); ?>" href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home">
		<img src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/logo.webp' ); ?>" width="500" height="147" alt="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>">
	</a>
	<?php
}

/**
 * Link to a section of the home page, e.g. ghstore_home_anchor( 'faq' ).
 *
 * @param string $id Section id.
 * @return string
 */
function ghstore_home_anchor( $id ) {
	return home_url( '/#' . $id );
}

/**
 * Where "Get a quote" buttons go: the home page quote form when it is shown,
 * otherwise WhatsApp, otherwise a phone call.
 *
 * @return string
 */
function ghstore_quote_url() {
	if ( ghstore_mod( 'show_quote' ) ) {
		return ghstore_home_anchor( 'quote' );
	}

	return ghstore_whatsapp_url() ? ghstore_whatsapp_url() : ghstore_tel_url();
}

/**
 * Shop page URL, or empty without WooCommerce.
 *
 * @return string
 */
function ghstore_shop_url() {
	if ( function_exists( 'wc_get_page_id' ) && wc_get_page_id( 'shop' ) > 0 ) {
		return wc_get_page_permalink( 'shop' );
	}

	return '';
}

/**
 * WhatsApp chat link with an optional pre-filled message.
 *
 * @param string $message Message text.
 * @return string Empty when no WhatsApp number is set.
 */
function ghstore_whatsapp_url( $message = '' ) {
	$number = preg_replace( '/\D+/', '', (string) ghstore_mod( 'whatsapp' ) );
	if ( ! $number ) {
		return '';
	}

	if ( '' === $message ) {
		/* translators: %s: site name. */
		$message = sprintf( __( 'Hi %s, I’d like to find out more about going solar.', 'green-home-store' ), get_bloginfo( 'name' ) );
	}

	return 'https://wa.me/' . $number . '?text=' . rawurlencode( $message );
}

/**
 * Phone number as a tel: link.
 *
 * @return string Empty when no phone number is set.
 */
function ghstore_tel_url() {
	$digits = preg_replace( '/[^\d+]+/', '', (string) ghstore_mod( 'phone' ) );

	return $digits ? 'tel:' . $digits : '';
}

/**
 * Split a textarea setting into its non-empty lines.
 *
 * @param string $text Text.
 * @return string[]
 */
function ghstore_lines( $text ) {
	return array_values( array_filter( array_map( 'trim', preg_split( '/\R/', (string) $text ) ) ) );
}

/**
 * Header links shown until a menu is assigned to "Header menu".
 *
 * @param array $args wp_nav_menu() arguments.
 * @return string|void
 */
function ghstore_menu_fallback( $args = array() ) {
	$links = array( array( home_url( '/' ), __( 'Home', 'green-home-store' ), is_front_page() ) );

	if ( ghstore_shop_url() ) {
		$links[] = array( ghstore_shop_url(), __( 'Shop', 'green-home-store' ), function_exists( 'is_shop' ) && ( is_shop() || is_product_taxonomy() || is_product() ) );
	}

	$anchors = array(
		'kits'     => __( 'Solar Kits', 'green-home-store' ),
		'services' => __( 'Services', 'green-home-store' ),
		'faq'      => __( 'FAQ', 'green-home-store' ),
		'quote'    => __( 'Contact', 'green-home-store' ),
	);
	foreach ( $anchors as $id => $label ) {
		if ( ghstore_mod( 'show_' . $id ) ) {
			$links[] = array( ghstore_home_anchor( $id ), $label, false );
		}
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
 * Section heading block: small label, title and intro.
 *
 * @param string $eyebrow Small label above the title.
 * @param string $title   Title.
 * @param string $intro   Intro sentence.
 * @param string $tag     Heading tag.
 */
function ghstore_section_head( $eyebrow, $title, $intro = '', $tag = 'h2' ) {
	$tag = in_array( $tag, array( 'h1', 'h2' ), true ) ? $tag : 'h2';
	?>
	<div class="section-head">
		<?php if ( $eyebrow ) : ?>
			<span class="eyebrow"><?php echo esc_html( $eyebrow ); ?></span>
		<?php endif; ?>
		<<?php echo esc_html( $tag ); ?> class="section-title"><?php echo esc_html( $title ); ?></<?php echo esc_html( $tag ); ?>>
		<?php if ( $intro ) : ?>
			<p class="section-intro"><?php echo esc_html( $intro ); ?></p>
		<?php endif; ?>
	</div>
	<?php
}

/**
 * Date, author and categories line for posts.
 */
function ghstore_post_meta() {
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
			esc_html__( 'by %s', 'green-home-store' ),
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
 * Heading for the blog, archives and search results.
 *
 * @return array{title: string, text: string}
 */
function ghstore_listing_heading() {
	if ( is_search() ) {
		return array(
			/* translators: %s: search query. */
			'title' => sprintf( __( 'Results for “%s”', 'green-home-store' ), get_search_query() ),
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
		'title' => $posts_page ? get_the_title( $posts_page ) : __( 'News & solar tips', 'green-home-store' ),
		'text'  => '',
	);
}
