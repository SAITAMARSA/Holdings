<?php
/**
 * Post card. Pass 'compact' => true for a small row card.
 */
$compact = ! empty( $args['compact'] );
$cats    = get_the_category();
?>
<article <?php post_class( 'card' . ( $compact ? ' compact' : '' ) ); ?>>
	<?php if ( has_post_thumbnail() ) : ?>
		<a class="thumb" href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true">
			<?php the_post_thumbnail( 'viraly-card', array( 'loading' => 'lazy' ) ); ?>
		</a>
	<?php endif; ?>
	<div>
		<?php if ( $cats ) : ?>
			<a class="cat" href="<?php echo esc_url( get_category_link( $cats[0] ) ); ?>"><?php echo esc_html( $cats[0]->name ); ?></a>
		<?php endif; ?>
		<h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
		<?php if ( ! $compact ) : ?>
			<p class="excerpt"><?php echo esc_html( get_the_excerpt() ); ?></p>
		<?php endif; ?>
		<div class="meta"><?php echo esc_html( get_the_date() ); ?></div>
	</div>
</article>
