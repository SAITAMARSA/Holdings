<?php
/**
 * Home / blog index: lead story, latest stories, then category sections.
 */
get_header();

if ( have_posts() ) :
	$paged = max( 1, (int) get_query_var( 'paged' ) );
	$first = $paged === 1;
	$shown = array();

	if ( $first ) :
		$lead_posts = array();
		while ( have_posts() && count( $lead_posts ) < 3 ) {
			the_post();
			$lead_posts[] = get_post();
		}
		$main = array_shift( $lead_posts );
		$shown[] = $main->ID;
		?>
		<section class="lead">
			<?php
			global $post;
			$post = $main;
			setup_postdata( $post );
			?>
			<article class="lead-main">
				<?php if ( has_post_thumbnail() ) {
					the_post_thumbnail( 'viraly-lead' );
				} ?>
				<div class="lead-text">
					<?php $cats = get_the_category(); if ( $cats ) : ?>
						<span class="cat" style="color:#fff;background:var(--accent);padding:2px 8px;border-radius:4px;"><?php echo esc_html( $cats[0]->name ); ?></span>
					<?php endif; ?>
					<h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
					<div class="meta" style="color:#ddd;"><?php echo esc_html( get_the_date() ); ?></div>
				</div>
			</article>
			<div class="lead-side">
				<?php
				foreach ( $lead_posts as $post ) {
					setup_postdata( $post );
					get_template_part( 'template-parts/card', null, array( 'compact' => true ) );
				}
				wp_reset_postdata();
				?>
			</div>
		</section>
		<h2 class="section-title"><?php esc_html_e( 'Latest', 'viraly' ); ?></h2>
	<?php endif; ?>

	<div class="grid">
		<?php
		while ( have_posts() ) {
			the_post();
			get_template_part( 'template-parts/card' );
		}
		?>
	</div>

	<?php the_posts_pagination( array( 'class' => 'pagination', 'prev_text' => '&larr;', 'next_text' => '&rarr;' ) ); ?>

	<?php
	if ( $first ) :
		$cat_ids = get_categories( array( 'orderby' => 'count', 'order' => 'DESC', 'number' => 3, 'hide_empty' => true ) );
		foreach ( $cat_ids as $c ) :
			$q = new WP_Query( array( 'cat' => $c->term_id, 'posts_per_page' => 3, 'ignore_sticky_posts' => true, 'no_found_rows' => true ) );
			if ( ! $q->have_posts() ) {
				continue;
			}
			?>
			<h2 class="section-title"><a href="<?php echo esc_url( get_category_link( $c ) ); ?>"><?php echo esc_html( $c->name ); ?></a></h2>
			<div class="grid">
				<?php
				while ( $q->have_posts() ) {
					$q->the_post();
					get_template_part( 'template-parts/card' );
				}
				?>
			</div>
			<?php
			wp_reset_postdata();
		endforeach;
	endif;
else :
	?>
	<p><?php esc_html_e( 'No posts yet. Add one in the WordPress admin under Posts → Add New.', 'viraly' ); ?></p>
<?php endif;

get_footer();
