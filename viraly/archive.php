<?php
get_header();
?>
<header class="archive-head">
	<h1><?php the_archive_title(); ?></h1>
	<?php the_archive_description( '<p>', '</p>' ); ?>
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
	<?php the_posts_pagination( array( 'class' => 'pagination', 'prev_text' => '&larr;', 'next_text' => '&rarr;' ) ); ?>
<?php else : ?>
	<p><?php esc_html_e( 'Nothing here yet.', 'viraly' ); ?></p>
<?php endif;

get_footer();
