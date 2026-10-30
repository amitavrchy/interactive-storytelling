import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString, IsUUID, Length, Matches, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';

export class RegisterDto {
  @IsEmail() @MaxLength(254) email: string;
  @IsString() @Length(2, 80) name: string;
  @IsString() @Length(10, 72) password: string;
}
export class LoginDto {
  @IsEmail() @MaxLength(254) email: string;
  @IsString() @Length(1, 72) password: string;
}
export class VoteDto {
  @IsIn(['beacon', 'rescue']) optionKey: 'beacon' | 'rescue';
  @IsUUID('4') requestId: string;
}
export class ProgressDto {
  @IsInt() @Min(0) @Max(5) chapterIndex: number;
  @IsInt() @Min(0) @Max(5) furthestChapter: number;
  @IsArray() @ArrayMaxSize(20) @IsIn(['shore', 'keeper', 'storm', 'choice', 'dawn', 'complete'], { each: true }) flags: string[];
  @IsOptional() @IsIn(['beacon', 'rescue']) ending: 'beacon' | 'rescue' | null;
  @IsBoolean() completed: boolean;
  @IsBoolean() reducedMotion: boolean;
  @IsBoolean() captions: boolean;
}
export class ChapterContentDto {
  @IsString() @Length(1, 100) label: string;
  @IsString() @Length(1, 300) subtitle: string;
  @IsIn(['fog', 'lighthouse', 'storm', 'choice', 'dawn', 'epilogue']) scene: string;
  @IsString() @Matches(/^\d{2}:\d{2}$/) time: string;
  @IsString() @Length(1, 180) location: string;
  @IsIn(['shore', 'keeper', 'storm', 'choice', 'dawn', 'complete']) unlockFlag: string;
  @IsArray() @ArrayMaxSize(12) @IsString({ each: true }) @MaxLength(3000, { each: true }) paragraphs: string[];
  @IsString() @Length(1, 500) quote: string;
  @IsString() @Length(1, 500) caption: string;
}
export class ChapterDto {
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(80) slug: string;
  @IsString() @Length(1, 160) title: string;
  @IsInt() @Min(0) @Max(100) sortOrder: number;
  @IsBoolean() published: boolean;
  @ValidateNested() @Type(() => ChapterContentDto) contentJson: ChapterContentDto;
}
export class LoreDto {
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(80) slug: string;
  @IsString() @Length(1, 160) title: string;
  @IsString() @MinLength(1) @MaxLength(10000) body: string;
  @IsIn(['shore', 'keeper', 'storm', 'choice', 'dawn', 'complete']) unlockFlag: string;
  @IsString() @Length(1, 80) category: string;
  @IsString() @Length(1, 100) date: string;
}
