<?php
/**
 * One post in a news list. Products (in site search results) show their
 * price where posts show their date.
 *
 * @package PixelPort
 *
 * @var array $args { @type string $heading Heading tag for the title, h2 or h3. }
 */

$pixelport_tag     = isset( $args['heading'] ) && 'h3' === $args['heading'] ? 'h3' : 'h2';
$pixelport_product = 'product' === get_post_type() && function_exists( 'wc_get_product' ) ? wc_get_product( get_the_ID() ) : null;
?>
<article id="post-<?php the_ID(); ?>" <?php post_class( 'news-item' ); ?>>
	<?php if ( $pixelport_product ) : ?>
		<span class="news-kicker"><?php echo wp_kses_post( $pixelport_product->get_price_html() ); ?></span>
	<?php else : ?>
		<time datetime="<?php echo esc_attr( get_the_date( DATE_W3C ) ); ?>"><?php echo esc_html( get_the_date( 'j M Y' ) ); ?></time>
	<?php endif; ?>
	<div>
		<<?php echo esc_html( $pixelport_tag ); ?> class="news-title">
			<a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
		</<?php echo esc_html( $pixelport_tag ); ?>>
		<p><?php echo esc_html( wp_trim_words( get_the_excerpt(), 32 ) ); ?></p>
	</div>
</article>
