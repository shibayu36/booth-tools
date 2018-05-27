#!/usr/bin/env perl
use strict;
use warnings;
use utf8;

use Text::CSV_XS;
use Path::Class qw(file);
use IO::String;
use Encode qw(encode decode_utf8 encode_utf8);
use List::MoreUtils qw(natatime);

use feature qw(say);

# 引数1にbooth.pmからダウンロードしたCSVを与える
my $path = shift @ARGV;

my $content = decode_utf8(file($path)->slurp);
my $io = IO::String->new($content);
$io->getline; # 1行目は除去
my $csv = Text::CSV_XS->new({ binary => 1 })->getline_all($io);

my $counter = 1;
my $it = natatime 40, reverse(@$csv);
while (my @rows = $it->()) {
    my $fh = file("clickpost$counter.csv")->openw;
    say { $fh } encode('cp932', join(
        ',',
        'お届け先郵便番号', 'お届け先氏名', 'お届け先敬称',
        'お届け先住所1行目', 'お届け先住所2行目', 'お届け先住所3行目', 'お届け先住所4行目', '内容品'
    ));
    for my $row (@rows) {
        say { $fh } encode('cp932', join(
            ',',
            $row->[8],
            $row->[12],
            '様',
            $row->[9],
            $row->[10],
            $row->[11],
            '',
            '本',
        ));
    }
    close $fh;
    $counter++;
}
