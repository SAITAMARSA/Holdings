<?php
get_header();
?>
<header class="archive-head">
	<h1>
		<?php
		/* translators: %s: search query */
		printf( esc_html__( 'Search results for "%s"', 'viraly' ), esc_html( get_search_query() ) );
		?>
	</h1>
	<?php get_search_form(); ?>
</header>

<?php if ( have_posts() ) : ?>
	<div class="grid">
		<?php
		while ( have_posts() ) {
			the_post();
			get_template_part( 'template-parts/card' );
		}
		?>
	</div>
	<?php the_posts_pagination( array( 'class' => 'pagination' ) ); ?>
<?php else : ?>
	<p><?php esc_html_e( 'No results. Try different words.', 'viraly' ); ?></p>
<?php endif;

get_footer();
