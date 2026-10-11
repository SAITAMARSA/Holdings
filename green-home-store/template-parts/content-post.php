<?php
/**
 * One item in a post list or search results. Products show their price
 * where posts show their date.
 *
 * @package GreenHomeStore
 */

$ghstore_product = 'product' === get_post_type() && function_exists( 'wc_get_product' ) ? wc_get_product( get_the_ID() ) : null;
?>
<article id="post-<?php the_ID(); ?>" <?php post_class( 'post-item' ); ?>>
	<?php if ( has_post_thumbnail() ) : ?>
		<a class="post-item-media" href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true"><?php the_post_thumbnail( 'medium' ); ?></a>
	<?php endif; ?>
	<div class="post-item-body">
		<?php if ( $ghstore_product ) : ?>
			<span class="post-item-kicker price"><?php echo wp_kses_post( $ghstore_product->get_price_html() ); ?></span>
		<?php else : ?>
			<time class="post-item-kicker" datetime="<?php echo esc_attr( get_the_date( DATE_W3C ) ); ?>"><?php echo esc_html( get_the_date() ); ?></time>
		<?php endif; ?>
		<h2 class="post-item-title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
		<p><?php echo esc_html( wp_trim_words( get_the_excerpt(), 30 ) ); ?></p>
	</div>
</article>
