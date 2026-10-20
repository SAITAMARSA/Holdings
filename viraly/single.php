<?php
get_header();

while ( have_posts() ) :
	the_post();
	$cats = get_the_category();
	?>
	<article <?php post_class( 'entry' ); ?>>
		<?php if ( $cats ) : ?>
			<a class="cat" href="<?php echo esc_url( get_category_link( $cats[0] ) ); ?>"><?php echo esc_html( $cats[0]->name ); ?></a>
		<?php endif; ?>
		<h1 class="entry-title"><?php the_title(); ?></h1>
		<div class="meta">
			<?php
			printf(
				/* translators: 1: author, 2: date */
				esc_html__( 'By %1$s · %2$s', 'viraly' ),
				esc_html( get_the_author() ),
				esc_html( get_the_date() )
			);
			?>
		</div>
		<?php if ( has_post_thumbnail() ) : ?>
			<div class="entry-thumb"><?php the_post_thumbnail( 'viraly-lead' ); ?></div>
		<?php endif; ?>
		<div class="entry-content"><?php the_content(); ?></div>
		<?php the_tags( '<div class="tags">', '', '</div>' ); ?>
		<nav class="post-nav" aria-label="<?php esc_attr_e( 'Posts', 'viraly' ); ?>">
			<div><?php previous_post_link( '%link', '&larr; %title' ); ?></div>
			<div><?php next_post_link( '%link', '%title &rarr;' ); ?></div>
		</nav>
	</article>
	<?php
	if ( comments_open() || get_comments_number() ) {
		comments_template();
	}
endwhile;

get_footer();
